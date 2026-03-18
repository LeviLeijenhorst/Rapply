import React, { useEffect, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native"
import { useNavigation } from "@react-navigation/native"

import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import {
  getMobileE2eeStatus,
  restoreMobileE2eeWithRecoveryKey,
  setupMobileE2ee,
  type MobileE2eeStatus,
} from "@/services/e2eeMobile"

export default function KeyCustodySetupScreen() {
  const navigation = useNavigation<any>()
  const [status, setStatus] = useState<MobileE2eeStatus | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("")
  const [newRecoveryKey, setNewRecoveryKey] = useState<string | null>(null)
  const [isRecoveryConfirmed, setIsRecoveryConfirmed] = useState(false)

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const nextStatus = await getMobileE2eeStatus()
        if (!active) return
        if (!nextStatus.requiresSetup) {
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
          return
        }
        setStatus(nextStatus)
      } catch (error: any) {
        if (!active) return
        setErrorMessage(String(error?.message || error || "Failed to load encryption status"))
      }
    })()
    return () => {
      active = false
    }
  }, [navigation])

  async function handleCreate() {
    setErrorMessage(null)
    setIsBusy(true)
    try {
      const result = await setupMobileE2ee({ custodyMode: "self" })
      setNewRecoveryKey(result.recoveryKey)
      setIsRecoveryConfirmed(false)
    } catch (error: any) {
      setErrorMessage(String(error?.message || error || "Encryption setup failed"))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRecoveryFromKey() {
    setErrorMessage(null)
    setIsBusy(true)
    try {
      await restoreMobileE2eeWithRecoveryKey(recoveryKeyInput.trim())
      navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
    } catch (error: any) {
      setErrorMessage(String(error?.message || error || "Recovery failed"))
    } finally {
      setIsBusy(false)
    }
  }

  if (!status) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    )
  }

  if (newRecoveryKey && !isRecoveryConfirmed) {
    return (
      <View style={styles.root}>
        <View style={styles.container}>
          <Text style={styles.title}>Save your Rapply-key</Text>
          <Text style={styles.body}>
            This key unlocks your encrypted data on new devices. Store it safely before you continue.
          </Text>
          <View style={styles.keyBox}>
            <Text style={styles.keyText}>{newRecoveryKey}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed ? styles.primaryBtnPressed : null, isBusy ? styles.btnDisabled : null]}
            disabled={isBusy}
            onPress={() => {
              vibrate()
              setIsRecoveryConfirmed(true)
              navigation.reset({ index: 0, routes: [{ name: "Welcome" }] })
            }}
          >
            <Text style={styles.primaryBtnText}>I stored this key</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  const requiresRecovery = status.e2eeEnabledServerSide

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>{requiresRecovery ? "Restore encryption key" : "Set up encryption key"}</Text>
        {requiresRecovery ? (
          <>
            <Text style={styles.body}>This account already has end-to-end encryption enabled. Unlock with your Rapply-key.</Text>
            <TextInput
              value={recoveryKeyInput}
              onChangeText={setRecoveryKeyInput}
              placeholder="Rapply-key"
              placeholderTextColor={colors.textSecondary}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
            />
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryBtn, pressed ? styles.primaryBtnPressed : null, isBusy ? styles.btnDisabled : null]}
              disabled={isBusy || !recoveryKeyInput.trim()}
              onPress={() => {
                vibrate()
                void handleRecoveryFromKey()
              }}
            >
              <Text style={styles.primaryBtnText}>Unlock with key</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.body}>Rapply uses self-custody. You keep the Rapply-key for account recovery.</Text>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryBtn, pressed ? styles.primaryBtnPressed : null, isBusy ? styles.btnDisabled : null]}
              disabled={isBusy}
              onPress={() => {
                vibrate()
                void handleCreate()
              }}
            >
              <Text style={styles.primaryBtnText}>Continue</Text>
            </Pressable>
          </>
        )}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingTop: safeAreaTop + spacing.big },
  loadingWrap: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  container: {
    flex: 1,
    paddingHorizontal: spacing.big,
    paddingBottom: safeAreaBottom + spacing.big,
    gap: spacing.small,
  },
  title: {
    fontFamily: typography.fontFamily,
    fontSize: 28,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  body: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  input: {
    height: 52,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.searchBar,
    paddingHorizontal: spacing.big,
    backgroundColor: colors.white,
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
  },
  keyBox: {
    borderRadius: radius,
    borderWidth: 1,
    borderColor: colors.searchBar,
    padding: spacing.big,
    backgroundColor: colors.backgroundLight,
  },
  keyText: {
    fontFamily: typography.fontFamily,
    fontSize: 15,
    color: colors.textPrimary,
  },
  choiceCard: {
    borderWidth: 1,
    borderColor: colors.searchBar,
    borderRadius: radius,
    padding: spacing.big,
    backgroundColor: colors.white,
  },
  choiceCardSelected: {
    borderColor: colors.orange,
    borderWidth: 2,
  },
  choiceCardPressed: {
    opacity: 0.95,
  },
  choiceTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  choiceBody: {
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: colors.textSecondary,
  },
  primaryBtn: {
    marginTop: spacing.small,
    height: 52,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  primaryBtnPressed: {
    opacity: 0.95,
  },
  primaryBtnText: {
    color: colors.white,
    fontFamily: typography.fontFamily,
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorText: {
    marginTop: spacing.small,
    fontFamily: typography.fontFamily,
    fontSize: 14,
    color: "#B00020",
  },
})
