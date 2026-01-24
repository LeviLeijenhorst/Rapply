import React, { useRef, useState } from "react"
import { View, StyleSheet, Pressable, Keyboard } from "react-native"
import { Text } from "./Text"
import { colors, spacing, typography, radius, safeAreaTop, vibrate } from "./constants"
import { Icon } from "./Icon"
import BackButton from "./BackButton"
import { Input } from "./Input"
import { writeEncryptedFile } from "./EncryptedStorage"
import { useNavigation, useFocusEffect } from "@react-navigation/native"

export default function AddCoacheeScreen() {
  const navigation = useNavigation<any>()
  const [name, setName] = useState("")
  const inputRef = useRef<any>(null)

  useFocusEffect(
    React.useCallback(() => {
      const id = setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
      return () => clearTimeout(id)
    }, []),
  )

  function onBack() {
    vibrate()
    Keyboard.dismiss()
    navigation.goBack()
  }

  async function onSave() {
    const trimmed = name.trim()
    if (!trimmed) return
    vibrate()
    Keyboard.dismiss()
    await writeEncryptedFile("coachees", trimmed, trimmed, "text")
    navigation.goBack()
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.headerRow}>
        <BackButton onPress={onBack} />
        <Pressable onPress={onSave}>
          <Text style={styles.save}>Opslaan</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Naam coachee</Text>
        <Input ref={inputRef} value={name} onChangeText={setName} placeholder="Naam" placeholderTextColor="#656565" showSoftInputOnFocus />
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
