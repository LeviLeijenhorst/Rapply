import React, { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { decryptAudioChunkFromStorage, decryptAudioFromStorage, decryptAudioStreamFromStorage, encryptAudioChunkForStorage, encryptAudioForStorage } from './audioCrypto'
import {
  createRandomId,
  createRecoveryKey,
  createUserDataKeyBytes,
  decryptText,
  encryptText,
  generateRsaKeyPair,
  importAesKey,
  importRsaPrivateKeyFromPkcs8,
  importRsaPublicKeyFromJwk,
  unwrapUserDataKeyForDevice,
  unwrapUserDataKeyForRecovery,
  wrapUserDataKeyForDevice,
  wrapUserDataKeyForRecovery,
} from './crypto'
import { loadDeviceRecord, saveDeviceRecord } from './deviceStore'
import {
  e2eeBootstrap,
  e2eeGetWrappedUserDataKeyForRecovery,
  e2eeRegisterDevice,
  e2eeRequestPairing,
  e2eeRotateRecoveryWrappedKey,
  e2eeSetWrappedUserDataKeyForDevice,
  e2eeSetup,
} from '../services/e2ee'

type E2eeContextValue = {
  encryptText: (value: string) => Promise<string>
  decryptText: (value: string) => Promise<string>
  encryptOptionalText: (value: string | null) => Promise<string | null>
  decryptOptionalText: (value: string | null) => Promise<string | null>

  encryptAudioBlobForStorage: (params: { audioBlob: Blob; mimeType: string }) => Promise<Blob>
  decryptAudioBlobFromStorage: (encryptedBlob: Blob) => Promise<{ audioBlob: Blob; mimeType: string }>
  decryptAudioStreamFromStorage: (encryptedStream: ReadableStream<Uint8Array>) => Promise<{ stream: ReadableStream<Uint8Array>; mimeType: string }>
  encryptAudioChunkForStorage: (params: { audioBytes: Uint8Array }) => Promise<Uint8Array>
  decryptAudioChunkFromStorage: (params: { encryptedChunk: Uint8Array }) => Promise<Uint8Array>

  wrapUserDataKeyForDevicePublicKeyJwk: (publicKeyJwk: JsonWebKey) => Promise<string>
  rotateRecoveryKey: () => Promise<string>
  requestPairing: () => Promise<{ expiresAtMs: number }>
}

const E2eeContext = createContext<E2eeContextValue | null>(null)

type Props = {
  isAuthenticated: boolean
  children: ReactNode
}

function downloadTextFile(params: { fileName: string; text: string }) {
  const blob = new Blob([params.text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = params.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function E2eeProvider({ isAuthenticated, children }: Props) {
  const [stage, setStage] = useState<'unauthenticated' | 'loading' | 'setupRecoveryKey' | 'recoveryRequired' | 'ready'>('unauthenticated')

  const [userDataKey, setUserDataKey] = useState<CryptoKey | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [devicePublicKeyJwk, setDevicePublicKeyJwk] = useState<JsonWebKey | null>(null)
  const [devicePrivateKey, setDevicePrivateKey] = useState<CryptoKey | null>(null)

  const [setupRecoveryKey, setSetupRecoveryKey] = useState<string | null>(null)
  const [isRecoveryConfirmed, setIsRecoveryConfirmed] = useState(false)
  const [recoveryInput, setRecoveryInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)

  useLayoutEffect(() => {
    if (!isAuthenticated) {
      setStage('unauthenticated')
      return
    }
    setStage('loading')
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) {
      setStage('unauthenticated')
      setUserDataKey(null)
      setDeviceId(null)
      setDevicePublicKeyJwk(null)
      setDevicePrivateKey(null)
      setSetupRecoveryKey(null)
      setIsRecoveryConfirmed(false)
      setRecoveryInput('')
      setStatusMessage(null)
      setIsBusy(false)
      return
    }

    let isActive = true
    void (async () => {
      try {
        setIsBusy(true)
        setStatusMessage(null)

        let device = await loadDeviceRecord()
        if (!device) {
          const generated = await generateRsaKeyPair()
          const nextDeviceId = createRandomId('device')
          await saveDeviceRecord({ deviceId: nextDeviceId, privateKeyPkcs8: generated.privateKeyPkcs8, publicKeyJwk: generated.publicKeyJwk })
          device = { deviceId: nextDeviceId, privateKeyPkcs8: generated.privateKeyPkcs8, publicKeyJwk: generated.publicKeyJwk }
        }

        const privateKey = await importRsaPrivateKeyFromPkcs8(device.privateKeyPkcs8)
        if (!isActive) return
        setDeviceId(device.deviceId)
        setDevicePublicKeyJwk(device.publicKeyJwk)
        setDevicePrivateKey(privateKey)

        await e2eeRegisterDevice({ deviceId: device.deviceId, publicKeyJwk: device.publicKeyJwk })
        const bootstrap = await e2eeBootstrap({ deviceId: device.deviceId })

        if (!bootstrap.e2eeEnabled) {
          const nextRecoveryKey = createRecoveryKey()
          const userDataKeyBytes = createUserDataKeyBytes()

          const publicKey = await importRsaPublicKeyFromJwk(device.publicKeyJwk)
          const wrappedForDevice = await wrapUserDataKeyForDevice({ devicePublicKey: publicKey, userDataKeyBytes })
          const wrappedForRecovery = await wrapUserDataKeyForRecovery({ recoveryKey: nextRecoveryKey, userDataKeyBytes })
          await e2eeSetup({ deviceId: device.deviceId, wrappedUserDataKeyForDevice: wrappedForDevice, wrappedUserDataKeyForRecovery: wrappedForRecovery })

          const nextUserDataKey = await importAesKey(userDataKeyBytes)
          if (!isActive) return
          setUserDataKey(nextUserDataKey)
          setSetupRecoveryKey(nextRecoveryKey)
          setIsRecoveryConfirmed(false)
          setStage('setupRecoveryKey')
          return
        }

        if (bootstrap.wrappedUserDataKeyForDevice) {
          const userDataKeyBytes = await unwrapUserDataKeyForDevice({ devicePrivateKey: privateKey, wrappedUserDataKeyForDevice: bootstrap.wrappedUserDataKeyForDevice })
          const nextUserDataKey = await importAesKey(userDataKeyBytes)
          if (!isActive) return
          setUserDataKey(nextUserDataKey)
          setSetupRecoveryKey(null)
          setIsRecoveryConfirmed(true)
          setStage('ready')
          return
        }

        if (!isActive) return
        setUserDataKey(null)
        setStage('recoveryRequired')
      } catch (error) {
        console.error('[E2eeProvider] Failed to initialize', error)
        if (!isActive) return
        setStatusMessage(error instanceof Error ? error.message : 'E2EE initialisatie mislukt')
        setUserDataKey(null)
        setStage('recoveryRequired')
      } finally {
        if (isActive) setIsBusy(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [isAuthenticated])

  async function handleRecover() {
    if (!deviceId || !devicePublicKeyJwk) return
    const recoveryKey = recoveryInput.trim()
    if (!recoveryKey) return

    setIsBusy(true)
    setStatusMessage(null)
    try {
      const recoveryWrapped = await e2eeGetWrappedUserDataKeyForRecovery()
      const userDataKeyBytes = await unwrapUserDataKeyForRecovery({ recoveryKey, wrappedUserDataKeyForRecovery: recoveryWrapped.wrappedUserDataKeyForRecovery })
      const nextUserDataKey = await importAesKey(userDataKeyBytes)

      const publicKey = await importRsaPublicKeyFromJwk(devicePublicKeyJwk)
      const wrappedForDevice = await wrapUserDataKeyForDevice({ devicePublicKey: publicKey, userDataKeyBytes })
      await e2eeSetWrappedUserDataKeyForDevice({ deviceId, wrappedUserDataKeyForDevice: wrappedForDevice })

      setUserDataKey(nextUserDataKey)
      setSetupRecoveryKey(null)
      setIsRecoveryConfirmed(true)
      setRecoveryInput('')
      setStage('ready')
    } catch (error) {
      console.error('[E2eeProvider] Recovery failed', error)
      setStatusMessage(error instanceof Error ? error.message : 'Herstel mislukt')
    } finally {
      setIsBusy(false)
    }
  }

  const value = useMemo<E2eeContextValue | null>(() => {
    if (!userDataKey || !deviceId) return null

    return {
      encryptText: (text) => encryptText({ key: userDataKey, plaintext: text }),
      decryptText: (text) => decryptText({ key: userDataKey, encrypted: text }),
      encryptOptionalText: async (text) => (text === null ? null : encryptText({ key: userDataKey, plaintext: text })),
      decryptOptionalText: async (text) => (text === null ? null : decryptText({ key: userDataKey, encrypted: text })),

      encryptAudioBlobForStorage: ({ audioBlob, mimeType }) => encryptAudioForStorage({ key: userDataKey, audioBlob, mimeType }),
      decryptAudioBlobFromStorage: (encryptedBlob) => decryptAudioFromStorage({ key: userDataKey, encryptedBlob }),
      decryptAudioStreamFromStorage: (encryptedStream) => decryptAudioStreamFromStorage({ key: userDataKey, encryptedStream }),
      encryptAudioChunkForStorage: ({ audioBytes }) => encryptAudioChunkForStorage({ key: userDataKey, audioBytes }),
      decryptAudioChunkFromStorage: ({ encryptedChunk }) => decryptAudioChunkFromStorage({ key: userDataKey, encryptedChunk }),

      wrapUserDataKeyForDevicePublicKeyJwk: async (publicKeyJwk) => {
        const userDataKeyBytes = await crypto.subtle.exportKey('raw', userDataKey).then((buffer) => new Uint8Array(buffer))
        const publicKey = await importRsaPublicKeyFromJwk(publicKeyJwk)
        return wrapUserDataKeyForDevice({ devicePublicKey: publicKey, userDataKeyBytes })
      },
      rotateRecoveryKey: async () => {
        const nextRecoveryKey = createRecoveryKey()
        const userDataKeyBytes = await crypto.subtle.exportKey('raw', userDataKey).then((buffer) => new Uint8Array(buffer))
        const wrappedUserDataKeyForRecovery = await wrapUserDataKeyForRecovery({ recoveryKey: nextRecoveryKey, userDataKeyBytes })
        await e2eeRotateRecoveryWrappedKey({ wrappedUserDataKeyForRecovery })
        return nextRecoveryKey
      },
      requestPairing: async () => e2eeRequestPairing({ deviceId }),
    }
  }, [deviceId, userDataKey])

  if (!isAuthenticated) {
    return <E2eeContext.Provider value={null}>{children}</E2eeContext.Provider>
  }

  return (
    <E2eeContext.Provider value={value}>
      {stage === 'setupRecoveryKey' && setupRecoveryKey && !isRecoveryConfirmed ? (
        <View style={styles.overlay}>
          {/* Recovery key setup */}
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              CoachScribe-code opslaan
            </Text>
            <Text style={styles.bodyText}>
              Dit is je CoachScribe-code. Sla hem op een veilige plek op. Op andere apparaten of een andere browser heb je deze code nodig om toegang te krijgen tot je data.
            </Text>
            <View style={styles.codeBox}>
              <Text isSemibold style={styles.codeText}>
                {setupRecoveryKey}
              </Text>
            </View>
            <Pressable onPress={() => downloadTextFile({ fileName: 'coachscribe-CoachScribe-code.txt', text: `${setupRecoveryKey}\n` })} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
              <Text isBold style={styles.secondaryButtonText}>Download</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (navigator?.clipboard?.writeText) {
                  void navigator.clipboard.writeText(setupRecoveryKey)
                }
              }}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.secondaryButtonText}>Kopieer</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setIsRecoveryConfirmed(true)
                setStage('ready')
              }}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
            >
              <Text isBold style={styles.primaryButtonText}>Ik heb dit opgeslagen</Text>
            </Pressable>
          </View>
        </View>
      ) : stage === 'recoveryRequired' ? (
        <View style={styles.overlay}>
          {/* Recovery required */}
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              CoachScribe-code nodig
            </Text>
            <Text style={styles.bodyText}>
              Dit apparaat heeft nog geen toegang tot je versleutelde data. Vul je CoachScribe-code in om dit apparaat toe te voegen.
            </Text>
            <TextInput
              value={recoveryInput}
              onChangeText={setRecoveryInput}
              placeholder="CoachScribe-code..."
              placeholderTextColor="#656565"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
              style={styles.input}
            />
            {statusMessage ? <Text style={styles.errorText}>{statusMessage}</Text> : null}
            <Pressable onPress={() => void handleRecover()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <Text isBold style={styles.primaryButtonText}>Ontgrendelen</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!deviceId) return
                setIsBusy(true)
                setStatusMessage(null)
                void e2eeRequestPairing({ deviceId })
                  .then(() => setStatusMessage('Koppelverzoek aangemaakt. Open dit scherm op je andere apparaat om te bevestigen.'))
                  .catch((error) => setStatusMessage(error instanceof Error ? error.message : 'Koppelen mislukt'))
                  .finally(() => setIsBusy(false))
              }}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]}
              disabled={isBusy}
            >
              <Text isBold style={styles.secondaryButtonText}>Koppelen met ander apparaat</Text>
            </Pressable>
          </View>
        </View>
      ) : stage === 'ready' && value ? (
        children
      ) : (
        <View style={styles.loadingOverlay}>
          {/* Loading */}
          <View style={styles.loadingContent}>
            <Text isBold style={styles.loadingTitle}>
              Bezig met ontgrendelen...
            </Text>
            <Text style={styles.loadingText}>{statusMessage ?? 'Even geduld.'}</Text>
          </View>
        </View>
      )}
    </E2eeContext.Provider>
  )
}

export function useE2ee() {
  const value = useContext(E2eeContext)
  if (!value) {
    throw new Error('useE2ee must be used within E2eeProvider')
  }
  return value
}

export function useOptionalE2ee() {
  return useContext(E2eeContext)
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as any,
  loadingOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: colors.pageBackground,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as any,
  loadingContent: {
    width: '100%',
    maxWidth: 640,
    gap: 10,
    alignItems: 'center',
  } as any,
  loadingTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
    textAlign: 'center',
  } as any,
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlign: 'center',
  } as any,
  card: {
    width: 720,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
  } as any,
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  codeBox: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.pageBackground,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  codeText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  input: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  } as any,
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.selected,
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
})
