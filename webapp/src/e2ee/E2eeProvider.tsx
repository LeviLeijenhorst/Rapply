import React, { createContext, ReactNode, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { EyeIcon } from '../components/icons/EyeIcon'
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon'
import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { decryptAudioChunkFromStorage, decryptAudioFromStorage, decryptAudioStreamFromStorage, encryptAudioChunkForStorage, encryptAudioForStorage } from './audioCrypto'
import {
  createRecoveryKey,
  createUserDataKeyBytes,
  decryptBytesWithAesGcm,
  decryptText,
  encryptBytesWithAesGcm,
  encryptText,
  importAesKey,
  unwrapUserDataKeyForRecovery,
  wrapUserDataKeyForRecovery,
} from './crypto'
import { clearRememberedArk, loadRememberedArk, saveRememberedArk } from './rememberedArkStore'
import { createArgon2SaltBase64Url, defaultArgon2Params, derivePassphraseKeyBytes } from './passphraseKdf'
import {
  e2eeBootstrap,
  e2eeDisableUserManagedCustody,
  e2eeEnableUserManagedCustody,
  e2eeGetUserKeyMaterial,
  e2eeSetRecoveryCode,
  e2eeSetup,
  e2eeUnlockServerManaged,
  type E2eeUserKeyMaterial,
} from '../services/e2ee'
import { useToast } from '../toast/ToastProvider'

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
  rotateRecoveryKey: () => Promise<string>
  isConfigured: boolean
  isEnabled: boolean
  setEnabled: (nextEnabled: boolean) => Promise<void>
  beginSetup: () => void
  shouldStoreAudioAsOctetStream: boolean
}

type SetupMode = 'none' | 'new' | 'recovered'
type E2eeStage = 'unauthenticated' | 'loading' | 'setupPassphrase' | 'setupRecoveryKey' | 'unlockWithPassphrase' | 'recoveryRequired' | 'ready'

const E2eeContext = createContext<E2eeContextValue | null>(null)

type Props = {
  isAuthenticated: boolean
  children: ReactNode
}

// Yields one tick so state updates render before expensive crypto work starts.
async function yieldToUiThread(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0))
}

// Downloads plain text as a local file for recovery-key backup.
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

function decodeBase64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function encodeBytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index])
  }
  return btoa(binary)
}

// Derives an AES key from the entered passphrase and Argon2 metadata.
async function createPassphraseKey(params: { passphrase: string; material: Pick<E2eeUserKeyMaterial, 'argon2Salt' | 'argon2TimeCost' | 'argon2MemoryCostKib' | 'argon2Parallelism'> }): Promise<CryptoKey> {
  const passphraseBytes = await derivePassphraseKeyBytes({
    passphrase: params.passphrase,
    saltBase64Url: params.material.argon2Salt,
    argon2: {
      timeCost: params.material.argon2TimeCost,
      memoryCostKib: params.material.argon2MemoryCostKib,
      parallelism: params.material.argon2Parallelism,
    },
  })
  return importAesKey(passphraseBytes)
}

// Manages passphrase-first E2EE setup, unlock, fallback recovery, and crypto helpers.
export function E2eeProvider({ isAuthenticated, children }: Props) {
  const [stage, setStage] = useState<E2eeStage>('unauthenticated')
  const [userDataKey, setUserDataKey] = useState<CryptoKey | null>(null)
  const [isConfigured, setIsConfigured] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [activeKeyVersion, setActiveKeyVersion] = useState<number | null>(null)
  const [setupMode, setSetupMode] = useState<SetupMode>('none')
  const [setupRecoveryKey, setSetupRecoveryKey] = useState<string | null>(null)
  const [isRecoveryConfirmed, setIsRecoveryConfirmed] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [passphraseInput, setPassphraseInput] = useState('')
  const [passphraseConfirmInput, setPassphraseConfirmInput] = useState('')
  const [unlockPassphraseInput, setUnlockPassphraseInput] = useState('')
  const [recoveryInput, setRecoveryInput] = useState('')
  const [isPassphraseVisible, setIsPassphraseVisible] = useState(false)
  const [isPassphraseConfirmVisible, setIsPassphraseConfirmVisible] = useState(false)
  const [isUnlockPassphraseVisible, setIsUnlockPassphraseVisible] = useState(false)
  const [pendingArkBytes, setPendingArkBytes] = useState<Uint8Array | null>(null)
  const [pendingMaterial, setPendingMaterial] = useState<E2eeUserKeyMaterial | null>(null)
  const { showErrorToast } = useToast()

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
      setIsConfigured(false)
      setIsEnabled(false)
      setActiveKeyVersion(null)
      setSetupMode('none')
      setSetupRecoveryKey(null)
      setIsRecoveryConfirmed(false)
      setStatusMessage(null)
      setIsBusy(false)
      setPassphraseInput('')
      setPassphraseConfirmInput('')
      setUnlockPassphraseInput('')
      setIsPassphraseVisible(false)
      setIsPassphraseConfirmVisible(false)
      setIsUnlockPassphraseVisible(false)
      setRecoveryInput('')
      setPendingArkBytes(null)
      setPendingMaterial(null)
      void clearRememberedArk()
      return
    }

    let isActive = true
    void (async () => {
      try {
        setIsBusy(true)
        setStatusMessage(null)
        const bootstrap = await e2eeBootstrap()

        if (!bootstrap.e2eeConfigured || !bootstrap.custodyMode) {
          if (!isActive) return
          setIsConfigured(false)
          setIsEnabled(false)
          setUserDataKey(null)
          setActiveKeyVersion(null)
          setStage('loading')
          return
        }

        setIsConfigured(true)
        setIsEnabled(bootstrap.custodyMode === 'user_managed')

        if (bootstrap.custodyMode === 'server_managed') {
          const unlocked = await e2eeUnlockServerManaged()
          const arkBytes = decodeBase64ToBytes(unlocked.arkBase64)
          await saveRememberedArk({ keyVersion: unlocked.keyVersion, arkBytes })
          const nextUserDataKey = await importAesKey(arkBytes)
          if (!isActive) return
          setActiveKeyVersion(unlocked.keyVersion)
          setUserDataKey(nextUserDataKey)
          setStage('ready')
          return
        }

        const material = await e2eeGetUserKeyMaterial()
        const rememberedArk = await loadRememberedArk()
        if (rememberedArk && rememberedArk.keyVersion === material.keyVersion) {
          const nextUserDataKey = await importAesKey(rememberedArk.arkBytes)
          if (!isActive) return
          setActiveKeyVersion(material.keyVersion)
          setUserDataKey(nextUserDataKey)
          setStage('ready')
          return
        }

        if (!isActive) return
        setActiveKeyVersion(material.keyVersion)
        setPendingMaterial(material)
        setStage('unlockWithPassphrase')
      } catch (error) {
        console.error('[E2eeProvider] Failed to initialize', error)
        if (!isActive) return
        setIsConfigured(false)
        setIsEnabled(false)
        setActiveKeyVersion(null)
        setUserDataKey(null)
        setStatusMessage(error instanceof Error ? error.message : 'E2EE initialisatie mislukt')
        setStage('loading')
      } finally {
        if (isActive) setIsBusy(false)
      }
    })()

    return () => {
      isActive = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!statusMessage) return
    if (stage === 'loading' || stage === 'ready' || stage === 'unauthenticated') return
    showErrorToast(statusMessage, 'Er ging iets mis met de beveiligingsinstellingen.')
  }, [showErrorToast, stage, statusMessage])

  // Creates or updates passphrase wrapping and unlocks the account key in-memory.
  async function handleSetupPassphrase() {
    const passphrase = passphraseInput.trim()
    const passphraseConfirm = passphraseConfirmInput.trim()
    if (passphrase.length < 8) {
      setStatusMessage('Gebruik minimaal 8 tekens voor je passphrase')
      return
    }
    if (passphrase !== passphraseConfirm) {
      setStatusMessage('Passphrases komen niet overeen')
      return
    }

    setIsBusy(true)
    setStatusMessage(null)
    try {
      await yieldToUiThread()
      if (setupMode === 'new') {
        let userDataKeyBytes: Uint8Array | null = pendingArkBytes
        if (!userDataKeyBytes && userDataKey) {
          userDataKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', userDataKey))
        }
        if (!userDataKeyBytes) {
          userDataKeyBytes = createUserDataKeyBytes()
        }
        const nextKeyVersion = activeKeyVersion ?? 1
        const nextRecoveryKey = createRecoveryKey()
        const argon2Salt = createArgon2SaltBase64Url()
        const passphraseKey = await createPassphraseKey({
          passphrase,
          material: {
            argon2Salt,
            argon2TimeCost: defaultArgon2Params.timeCost,
            argon2MemoryCostKib: defaultArgon2Params.memoryCostKib,
            argon2Parallelism: defaultArgon2Params.parallelism,
          },
        })
        const wrappedArkUserPassphrase = await encryptBytesWithAesGcm({ key: passphraseKey, plaintext: userDataKeyBytes })
        const wrappedArkRecoveryCode = await wrapUserDataKeyForRecovery({ recoveryKey: nextRecoveryKey, userDataKeyBytes })
        await e2eeEnableUserManagedCustody({
          cryptoVersion: 1,
          keyVersion: nextKeyVersion,
          argon2Salt,
          argon2TimeCost: defaultArgon2Params.timeCost,
          argon2MemoryCostKib: defaultArgon2Params.memoryCostKib,
          argon2Parallelism: defaultArgon2Params.parallelism,
          wrappedArkUserPassphrase,
          wrappedArkRecoveryCode,
          recoveryPolicy: 'self_service',
          custodianThreshold: null,
        })
        await saveRememberedArk({ keyVersion: nextKeyVersion, arkBytes: userDataKeyBytes })
        const nextUserDataKey = await importAesKey(userDataKeyBytes)
        setUserDataKey(nextUserDataKey)
        setIsConfigured(true)
        setIsEnabled(true)
        setActiveKeyVersion(nextKeyVersion)
        setSetupRecoveryKey(nextRecoveryKey)
        setIsRecoveryConfirmed(false)
        setPendingArkBytes(null)
        setStage('setupRecoveryKey')
        return
      }

      if (setupMode === 'recovered' && pendingArkBytes && pendingMaterial) {
        const argon2Salt = createArgon2SaltBase64Url()
        const passphraseKey = await createPassphraseKey({
          passphrase,
          material: {
            argon2Salt,
            argon2TimeCost: defaultArgon2Params.timeCost,
            argon2MemoryCostKib: defaultArgon2Params.memoryCostKib,
            argon2Parallelism: defaultArgon2Params.parallelism,
          },
        })
        const wrappedArkUserPassphrase = await encryptBytesWithAesGcm({ key: passphraseKey, plaintext: pendingArkBytes })
        await e2eeSetup({
          cryptoVersion: pendingMaterial.cryptoVersion,
          keyVersion: pendingMaterial.keyVersion,
          argon2Salt,
          argon2TimeCost: defaultArgon2Params.timeCost,
          argon2MemoryCostKib: defaultArgon2Params.memoryCostKib,
          argon2Parallelism: defaultArgon2Params.parallelism,
          wrappedArkUserPassphrase,
          wrappedArkRecoveryCode: pendingMaterial.wrappedArkRecoveryCode,
          recoveryPolicy: pendingMaterial.recoveryPolicy,
          custodianThreshold: pendingMaterial.custodianThreshold,
        })
        await saveRememberedArk({ keyVersion: pendingMaterial.keyVersion, arkBytes: pendingArkBytes })
        setUserDataKey(await importAesKey(pendingArkBytes))
        setIsConfigured(true)
        setIsEnabled(true)
        setActiveKeyVersion(pendingMaterial.keyVersion)
        setPendingArkBytes(null)
        setPendingMaterial(null)
        setStage('ready')
      }
    } catch (error) {
      console.error('[E2eeProvider] Passphrase setup failed', error)
      setStatusMessage(error instanceof Error ? error.message : 'Passphrase instellen mislukt')
    } finally {
      setIsBusy(false)
    }
  }

  // Unlocks existing account key material using the passphrase.
  async function handleUnlockWithPassphrase() {
    const passphrase = unlockPassphraseInput.trim()
    if (!passphrase) return

    setIsBusy(true)
    setStatusMessage(null)
    try {
      await yieldToUiThread()
      const material = pendingMaterial ?? (await e2eeGetUserKeyMaterial())
      const passphraseKey = await createPassphraseKey({
        passphrase,
        material: {
          argon2Salt: material.argon2Salt,
          argon2TimeCost: material.argon2TimeCost,
          argon2MemoryCostKib: material.argon2MemoryCostKib,
          argon2Parallelism: material.argon2Parallelism,
        },
      })
      const arkBytes = await decryptBytesWithAesGcm({ key: passphraseKey, encrypted: material.wrappedArkUserPassphrase })
      await saveRememberedArk({ keyVersion: material.keyVersion, arkBytes })
      const nextUserDataKey = await importAesKey(arkBytes)
      setUserDataKey(nextUserDataKey)
      setIsConfigured(true)
      setIsEnabled(true)
      setActiveKeyVersion(material.keyVersion)
      setStage('ready')
    } catch (error) {
      console.error('[E2eeProvider] Passphrase unlock failed', error)
      setStatusMessage('Passphrase klopt niet')
    } finally {
      setIsBusy(false)
    }
  }

  // Unlocks key material using recovery code and sends user to set a new passphrase.
  async function handleRecoverWithRecoveryCode() {
    const recoveryKey = recoveryInput.trim()
    if (!recoveryKey) return

    setIsBusy(true)
    setStatusMessage(null)
    try {
      await yieldToUiThread()
      const material = await e2eeGetUserKeyMaterial()
      if (!material.wrappedArkRecoveryCode) {
        throw new Error('CoachScribe-code herstel is niet beschikbaar voor dit account')
      }
      const userDataKeyBytes = await unwrapUserDataKeyForRecovery({ recoveryKey, wrappedUserDataKeyForRecovery: material.wrappedArkRecoveryCode })
      setPendingArkBytes(userDataKeyBytes)
      setPendingMaterial(material)
      setPassphraseInput('')
      setPassphraseConfirmInput('')
      setSetupMode('recovered')
      setStage('setupPassphrase')
      setStatusMessage('Stel nu een nieuwe passphrase in')
    } catch (error) {
      console.error('[E2eeProvider] Recovery failed', error)
      setStatusMessage(error instanceof Error ? error.message : 'Herstel mislukt')
    } finally {
      setIsBusy(false)
    }
  }

  function closeOptionalSetupModal() {
    if (isBusy) return
    if (setupMode !== 'new') return
    setSetupMode('none')
    setStatusMessage(null)
    setPassphraseInput('')
    setPassphraseConfirmInput('')
    setIsPassphraseVisible(false)
    setIsPassphraseConfirmVisible(false)
    setSetupRecoveryKey(null)
    setIsRecoveryConfirmed(false)
    setStage('ready')
  }

  const value = useMemo<E2eeContextValue | null>(() => {
    if (!isConfigured || !activeKeyVersion) return null
    if (!userDataKey) return null
    const activeUserDataKey = userDataKey

    return {
      encryptText: (text) => encryptText({ key: activeUserDataKey, plaintext: text }),
      decryptText: (text) => decryptText({ key: activeUserDataKey, encrypted: text }),
      encryptOptionalText: async (text) => (text === null ? null : encryptText({ key: activeUserDataKey, plaintext: text })),
      decryptOptionalText: async (text) => (text === null ? null : decryptText({ key: activeUserDataKey, encrypted: text })),
      encryptAudioBlobForStorage: ({ audioBlob, mimeType }) => encryptAudioForStorage({ key: activeUserDataKey, audioBlob, mimeType }),
      decryptAudioBlobFromStorage: (encryptedBlob) => decryptAudioFromStorage({ key: activeUserDataKey, encryptedBlob }),
      decryptAudioStreamFromStorage: (encryptedStream) => decryptAudioStreamFromStorage({ key: activeUserDataKey, encryptedStream }),
      encryptAudioChunkForStorage: ({ audioBytes }) => encryptAudioChunkForStorage({ key: activeUserDataKey, audioBytes }),
      decryptAudioChunkFromStorage: ({ encryptedChunk }) => decryptAudioChunkFromStorage({ key: activeUserDataKey, encryptedChunk }),
      rotateRecoveryKey: async () => {
        const nextRecoveryKey = createRecoveryKey()
        const userDataKeyBytes = await crypto.subtle.exportKey('raw', activeUserDataKey).then((buffer) => new Uint8Array(buffer))
        const wrappedUserDataKeyForRecovery = await wrapUserDataKeyForRecovery({ recoveryKey: nextRecoveryKey, userDataKeyBytes })
        await e2eeSetRecoveryCode({ wrappedArkRecoveryCode: wrappedUserDataKeyForRecovery })
        return nextRecoveryKey
      },
      isConfigured: true,
      isEnabled,
      setEnabled: async (nextEnabled) => {
        if (nextEnabled === isEnabled) return
        if (nextEnabled) {
          setSetupMode('new')
          setStatusMessage(null)
          setPassphraseInput('')
          setPassphraseConfirmInput('')
          setIsPassphraseVisible(false)
          setIsPassphraseConfirmVisible(false)
          setSetupRecoveryKey(null)
          setIsRecoveryConfirmed(false)
          setStage('setupPassphrase')
          return
        }

        const userDataKeyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', activeUserDataKey))
        await e2eeDisableUserManagedCustody({
          keyVersion: activeKeyVersion,
          arkBase64: encodeBytesToBase64(userDataKeyBytes),
        })
        setIsEnabled(false)
      },
      beginSetup: () => {
        if (isEnabled) return
        setSetupMode('new')
        setStatusMessage(null)
        setPassphraseInput('')
        setPassphraseConfirmInput('')
        setIsPassphraseVisible(false)
        setIsPassphraseConfirmVisible(false)
        setSetupRecoveryKey(null)
        setIsRecoveryConfirmed(false)
        setStage('setupPassphrase')
      },
      shouldStoreAudioAsOctetStream: true,
    }
  }, [activeKeyVersion, isConfigured, isEnabled, userDataKey])

  if (!isAuthenticated) {
    return <E2eeContext.Provider value={null}>{children}</E2eeContext.Provider>
  }

  const shouldRenderChildren =
    Boolean(value) &&
    (stage === 'ready' || stage === 'setupPassphrase' || (stage === 'setupRecoveryKey' && setupMode === 'new'))

  return (
    <E2eeContext.Provider value={value}>
      {shouldRenderChildren ? children : null}

      {stage === 'setupPassphrase' ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBackdropPressable} onPress={closeOptionalSetupModal} />
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              {setupMode === 'recovered' ? 'Nieuwe passphrase instellen' : 'Passphrase instellen'}
            </Text>
            <Text style={styles.bodyText}>
              {setupMode === 'recovered'
                ? 'Je account is hersteld met je CoachScribe-code. Stel nu een nieuwe passphrase in.'
                : 'Gebruik een passphrase om je versleutelde data in deze browser te ontgrendelen.'}
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                value={passphraseInput}
                onChangeText={setPassphraseInput}
                placeholder="Passphrase"
                placeholderTextColor="#656565"
                secureTextEntry={!isPassphraseVisible}
                editable={!isBusy}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.inputWithAction}
              />
              <Pressable onPress={() => setIsPassphraseVisible((value) => !value)} style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}>
                {isPassphraseVisible ? <EyeSlashIcon color="#656565" size={20} /> : <EyeIcon color="#656565" size={20} />}
              </Pressable>
            </View>
            <View style={styles.inputRow}>
              <TextInput
                value={passphraseConfirmInput}
                onChangeText={setPassphraseConfirmInput}
                placeholder="Herhaal passphrase"
                placeholderTextColor="#656565"
                secureTextEntry={!isPassphraseConfirmVisible}
                editable={!isBusy}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.inputWithAction}
              />
              <Pressable onPress={() => setIsPassphraseConfirmVisible((value) => !value)} style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}>
                {isPassphraseConfirmVisible ? <EyeSlashIcon color="#656565" size={20} /> : <EyeIcon color="#656565" size={20} />}
              </Pressable>
            </View>
            <Pressable onPress={() => void handleSetupPassphrase()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <View style={styles.primaryButtonContent}>
                {isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text isBold style={styles.primaryButtonText}>{isBusy ? 'Bezig...' : 'Doorgaan'}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      ) : stage === 'setupRecoveryKey' && setupRecoveryKey && !isRecoveryConfirmed ? (
        <View style={styles.overlay}>
          <Pressable style={styles.overlayBackdropPressable} onPress={closeOptionalSetupModal} />
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              CoachScribe-code opslaan
            </Text>
            <Text style={styles.bodyText}>
              Dit is je herstelcode. Sla hem op een veilige plek op voor het geval je je passphrase vergeet.
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
      ) : null}

      {stage === 'unlockWithPassphrase' ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              Ontgrendelen met passphrase
            </Text>
            <Text style={styles.bodyText}>
              Vul je passphrase in om toegang te krijgen tot je versleutelde data.
            </Text>
            <View style={styles.inputRow}>
              <TextInput
                value={unlockPassphraseInput}
                onChangeText={setUnlockPassphraseInput}
                placeholder="Passphrase"
                placeholderTextColor="#656565"
                secureTextEntry={!isUnlockPassphraseVisible}
                editable={!isBusy}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.inputWithAction}
              />
              <Pressable onPress={() => setIsUnlockPassphraseVisible((value) => !value)} style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}>
                {isUnlockPassphraseVisible ? <EyeSlashIcon color="#656565" size={20} /> : <EyeIcon color="#656565" size={20} />}
              </Pressable>
            </View>
            <Pressable onPress={() => void handleUnlockWithPassphrase()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <View style={styles.primaryButtonContent}>
                {isBusy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text isBold style={styles.primaryButtonText}>{isBusy ? 'Bezig...' : 'Ontgrendelen'}</Text>
              </View>
            </Pressable>
            <Pressable onPress={() => setStage('recoveryRequired')} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <Text isBold style={styles.secondaryButtonText}>CoachScribe-code gebruiken</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {stage === 'recoveryRequired' ? (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text isBold style={styles.title}>
              CoachScribe-code nodig
            </Text>
            <Text style={styles.bodyText}>
              Vul je herstelcode in om toegang te herstellen en een nieuwe passphrase te kiezen.
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
            <Pressable onPress={() => void handleRecoverWithRecoveryCode()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <Text isBold style={styles.primaryButtonText}>Herstellen</Text>
            </Pressable>
            <Pressable onPress={() => setStage('unlockWithPassphrase')} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isBusy ? styles.primaryButtonDisabled : undefined]} disabled={isBusy}>
              <Text isBold style={styles.secondaryButtonText}>Terug naar passphrase</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {stage === 'loading' ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text isBold style={styles.loadingTitle}>
              Bezig met ontgrendelen...
            </Text>
            <Text style={styles.loadingText}>{statusMessage ?? 'Even geduld.'}</Text>
          </View>
        </View>
      ) : null}
    </E2eeContext.Provider>
  )
}

// Returns the active E2EE context and throws when used outside the provider.
export function useE2ee() {
  const value = useContext(E2eeContext)
  if (!value) {
    throw new Error('useE2ee must be used within E2eeProvider')
  }
  return value
}

// Returns the active E2EE context or null when not available.
export function useOptionalE2ee() {
  return useContext(E2eeContext)
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(16,18,20,0.22)',
    ...( { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any ),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  } as any,
  overlayBackdropPressable: {
    position: 'absolute',
    inset: 0,
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
    zIndex: 1,
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
  inputRow: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWithAction: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
    ...( { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any ),
  },
  inputIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
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
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
