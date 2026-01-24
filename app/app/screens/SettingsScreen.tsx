import React from "react"
import { View, Pressable, StyleSheet } from "react-native"
import { Text } from "./Text"
import { Icon } from "./Icon"
import { colors, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { useNavigation } from "@react-navigation/native"
import SettingsHomeScreen from "./SettingsHomeScreen"

export default function SettingsScreen() {
  const navigation = useNavigation<any>()
  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Instellingen</Text>
          <Pressable
            onPress={() => {
              vibrate()
              navigation.navigate("SettingsAccount")
            }}
            accessibilityRole="button"
            accessibilityLabel="Mijn account"
            style={({ pressed }) => [pressed && { opacity: 0.8 }]}
          >
            <Icon name="profileCircle" />
          </Pressable>
        </View>

        <SettingsHomeScreen />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    paddingTop: safeAreaTop,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.big,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.small,
    paddingBottom: spacing.big,
  },
  headerTitle: {
    fontFamily: typography.fontFamily,
    fontSize: 22,
    color: colors.textPrimary,
  },
})
