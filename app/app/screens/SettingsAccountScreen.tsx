import React, { useEffect, useState } from "react"
import { View, StyleSheet, Alert, Modal } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { colors, radius, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { Input } from "./Input"
import { OverlayPressable } from "./OverlayPressable"
import { postToSecureApi } from "@/services/secureApi"
import { deleteDirectory } from "./EncryptedStorage"
import { getAuthSession, onAuthSessionChange, signOut, updateAccountDisplayName } from "@/services/auth"

export default function SettingsAccountScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [savedName, setSavedName] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordChanged, setShowPasswordChanged] = useState(false)
  const dirty = name.trim() !== savedName.trim()

  function onBack() {
    vibrate()
    navigation.goBack()
  }

  useEffect(() => {
    if (route?.params?.passwordChanged) {
      setShowPasswordChanged(true)
      navigation.setParams?.({ passwordChanged: undefined })
    }
  }, [route?.params?.passwordChanged])

  useEffect(() => {
    let isCancelled = false

    async function loadSession() {
      const session = await getAuthSession()
      if (isCancelled) return
      if (!session) {
        setUserId(null)
        setEmail("")
        setSavedName("")
        setName("")
        return
      }
      setUserId(session.userId)
      setEmail(session.email || "")
      const displayName = typeof session.displayName === "string" ? session.displayName : ""
      setSavedName(displayName)
      setName(displayName)
    }

    loadSession()

    const unsubscribe = onAuthSessionChange(() => loadSession())

    return () => {
      isCancelled = true
      unsubscribe()
    }
  }, [])

  async function onSave() {
    if (!userId) return
    setError(null)
    try {
      setLoading(true)
      const nextName = name.trim() || null
      await updateAccountDisplayName(nextName)
      setSavedName(name.trim())
      navigation.navigate("Settings", { showSaved: true })
    } catch (e: any) {
      let msg = "Er ging iets mis bij het opslaan. Log opnieuw in en probeer het nog eens."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function onLogout() {
    vibrate()
    try {
      await signOut()
      navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
    } catch {}
  }

  async function onDelete() {
    vibrate()
    if (!userId) return
    Alert.alert("Account verwijderen", "Weet je zeker dat je je account wilt verwijderen?", [
      { text: "Annuleren", style: "cancel" },
      {
        text: "Verwijderen",
        style: "destructive",
        onPress: async () => {
          setError(null)
          try {
            setLoading(true)
            await postToSecureApi("/account/delete", {})
            try {
              await deleteDirectory("Rapply")
            } catch {}
          try {
              await deleteDirectory("coachees")
            } catch {}
            try {
              await signOut()
            } catch {}
            navigation.reset({ index: 0, routes: [{ name: "AuthWelcome" }] })
          } catch {
            Alert.alert("Verwijderen mislukt", "Probeer het alsjeblieft later opnieuw.")
          } finally {
            setLoading(false)
          }
        },
      },
    ])
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View style={styles.headerSideLeft}>
          <BackButton onPress={onBack} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Mijn account</Text>
        </View>
        <View style={styles.headerSideRight}>
          {dirty ? (
            <OverlayPressable onPress={() => { vibrate(); onSave() }} accessibilityRole="button">
              <Text style={styles.save}>Opslaan</Text>
            </OverlayPressable>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Naam</Text>
        <Input value={name} onChangeText={setName} placeholder="Naam" editable={!loading} />

        <View style={{ height: spacing.big }} />

        <Text style={styles.label}>Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={false}
          accessibilityState={{ disabled: true }}
          style={{ opacity: 0.6 }}
        />

        <View style={{ height: spacing.big }} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <OverlayPressable
        accessibilityRole="button"
        onPress={() => {
          vibrate()
          navigation.navigate("ChangePassword")
        }}
        style={styles.card}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.rowText}>Account beheren</Text>
          <Icon name="chevronRight" />
        </View>
      </OverlayPressable>

      <OverlayPressable accessibilityRole="button" onPress={onLogout} style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.rowText}>Uitloggen</Text>
          <Icon name="logout" />
        </View>
      </OverlayPressable>

      <OverlayPressable accessibilityRole="button" onPress={onDelete} style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={[styles.rowText, { color: "#FF0001" }]}>Account verwijderen</Text>
          <Icon name="trash" color="#FF0001" />
        </View>
      </OverlayPressable>

      {/* Password changed success modal */}
      <Modal transparent visible={showPasswordChanged} animationType="fade" onRequestClose={() => setShowPasswordChanged(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Wachtwoord gewijzigd</Text>
              <Text style={{ fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textSecondary }}>
                Je wachtwoord is succesvol gewijzigd.
              </Text>
            </View>
            <View style={styles.modalActions}>
              <OverlayPressable
                onPress={() => {
                  vibrate()
                  setShowPasswordChanged(false)
                }}
                style={styles.modalBtn}
              >
                <Text style={styles.modalConfirm}>OK</Text>
              </OverlayPressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop, paddingHorizontal: spacing.big },
  headerRow: { position: "relative", flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: spacing.big, paddingBottom: spacing.big, minHeight: 48 },
  headerSideLeft: { width: 80, alignItems: "flex-start" },
  headerCenter: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  headerSideRight: { width: 80, alignItems: "flex-end" },
  headerTitle: { fontFamily: typography.fontFamily, fontSize: 22, color: colors.textPrimary },
  save: { color: colors.orange, fontFamily: typography.fontFamily, fontWeight: "700" },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    paddingVertical: spacing.big,
    marginBottom: spacing.big,
  },
  label: { color: colors.textPrimary, marginBottom: 6, fontFamily: typography.fontFamily },
  inputIconWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: 12, height: 64, justifyContent: "center" },
  error: { marginTop: 8, color: "#C62828" },
  helper: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.fontFamily, fontSize: typography.textSize, opacity: 0.7 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 44 },
  rowText: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.big,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius,
    padding: 0,
    overflow: "hidden",
  },
  modalTitle: { fontFamily: typography.fontFamily, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.small },
  modalContent: { padding: spacing.big },
  modalActions: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-end",
  },
  modalBtn: { flex: 1, height: 48, alignItems: "center", justifyContent: "center" },
  modalConfirm: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textOrange, fontWeight: "700" },
})
