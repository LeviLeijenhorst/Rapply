import React, { useEffect, useRef, useState } from "react"
import { View, StyleSheet, Pressable, Keyboard, TextInput } from "react-native"
import { Text } from "./Text"
import { colors, spacing, typography, radius, safeAreaTop, vibrate } from "./constants"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { useNavigation, useRoute } from "@react-navigation/native"
import { writeEncryptedFile } from "./EncryptedStorage"


export default function WrittenReportScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const coacheeName: string | undefined = route?.params?.coacheeName

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const titleRef = useRef<TextInput>(null as any)

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus?.(), 50)
    return () => clearTimeout(t)
  }, [])

  function onBack() {
    vibrate()
    Keyboard.dismiss()
    const hasContent = (title && title.trim().length > 0) || (body && body.trim().length > 0)
    if (hasContent) {
      onSave()
    } else {
      navigation.goBack()
    }
  }

  async function onSave() {
    vibrate()
    Keyboard.dismiss()
    const finalTitle = title.trim() || "Naamloos verslag"
    const reportId = String(Date.now())
    const coacheeId = (coacheeName || "").trim().toLowerCase().replace(/\s+/g, "_")
    if (coacheeId) {
      const baseDirectory = `Rapply/coachees/${coacheeId}/${reportId}`
      try {
        await writeEncryptedFile(baseDirectory, "type.txt.enc", "written_report", "text")
        await writeEncryptedFile(baseDirectory, "title.txt.enc", finalTitle, "text")
        const text = (body || "").trim()
        if (text.length > 0) {
          await writeEncryptedFile(baseDirectory, "summary.txt.enc", text, "text")
        }
      } catch {}
      navigation.navigate("CoacheeDetail", { coacheeName, newSessionTitle: finalTitle, newSessionType: "written_report", newSessionId: reportId })
      return
    }
    navigation.navigate("Welcome")
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <Pressable onPress={onSave} accessibilityRole="button">
          <Text style={styles.save}>Opslaan</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Titel</Text>
        <TextInput
          ref={titleRef as any}
          value={title}
          onChangeText={setTitle}
          placeholder="Naamloos verslag"
          style={styles.input}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={{ height: spacing.big }} />

        <Text style={styles.label}>Verslag</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Schrijf hier je verslag"
          style={[styles.input, styles.bodyInput]}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.backgroundLight, paddingTop: safeAreaTop },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.big,
  },
  save: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textOrange, fontWeight: "700" },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    padding: spacing.big,
  },
  label: { fontFamily: typography.fontFamily, fontSize: typography.textSize, color: colors.textPrimary, marginBottom: spacing.small },
  input: {
    height: 48,
    borderRadius: radius,
    paddingHorizontal: spacing.big,
    backgroundColor: colors.orange + "0D",
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textPrimary,
  },
  bodyInput: {
    height: 200,
    paddingTop: spacing.small,
  },
})
