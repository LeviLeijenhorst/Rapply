import React, { useRef, useState } from "react"
import { View, StyleSheet, Pressable, Keyboard, Alert } from "react-native"
import { useNavigation, useRoute } from "@react-navigation/native"
import { Directory, Paths } from "expo-file-system"

import BackButton from "./BackButton"
import { Input } from "./Input"
import { Text } from "./Text"
import { colors, spacing, typography, radius, safeAreaTop, vibrate } from "./constants"
import { deleteFile, listFiles, writeEncryptedFile } from "./EncryptedStorage"

export default function CoacheeEditScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()

  const initialCoacheeName: string = route?.params?.coacheeName ?? ""
  const [name, setName] = useState(initialCoacheeName)
  const inputRef = useRef<any>(null)

  function slugifyId(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, "_")
  }

  function onBack() {
    vibrate()
    Keyboard.dismiss()
    navigation.goBack()
  }

  async function onSave() {
    const oldName = (initialCoacheeName || "").trim()
    const nextName = (name || "").trim()
    if (!nextName) return

    vibrate()
    Keyboard.dismiss()

    if (oldName === nextName) {
      navigation.goBack()
      return
    }

    const allCoachees = await listFiles("coachees")
    if (allCoachees.includes(nextName)) {
      Alert.alert("Opslaan mislukt", "Deze coachee bestaat al.", [{ text: "Ok" }])
      return
    }

    const oldCoacheeId = slugifyId(oldName)
    const newCoacheeId = slugifyId(nextName)
    const fromDirectoryName = `Rapply/coachees/${oldCoacheeId}`
    const toDirectoryName = `Rapply/coachees/${newCoacheeId}`

    try {
      if (fromDirectoryName !== toDirectoryName) {
        const root = new Directory(Paths.document, "Rapply/coachees")
        if (!root.exists) {
          root.create({ intermediates: true, idempotent: true })
        }

        const fromDir = new Directory(Paths.document, fromDirectoryName)
        const toDir = new Directory(Paths.document, toDirectoryName)

        if (toDir.exists) {
          Alert.alert("Opslaan mislukt", "Er bestaat al data voor deze coachee. Kies een andere naam.", [{ text: "Ok" }])
          return
        }

        if (fromDir.exists) {
          fromDir.move(toDir)
        }
      }
    } catch (error: any) {
      const message = String(error?.message || error)
      Alert.alert("Opslaan mislukt", `Het hernoemen is niet gelukt. Probeer het opnieuw.\n\n${message}`, [{ text: "Ok" }])
      return
    }

    try {
      if (oldName) {
        await deleteFile("coachees", oldName)
      }
    } catch {}

    try {
      await writeEncryptedFile("coachees", nextName, nextName, "text")
    } catch {}

    navigation.navigate("CoacheeDetail", { coacheeName: nextName })
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
        <Text style={styles.label}>Naam coachee</Text>
        <Input
          ref={inputRef}
          value={name}
          onChangeText={setName}
          placeholder="Naam"
          placeholderTextColor="#656565"
          showSoftInputOnFocus
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
})





