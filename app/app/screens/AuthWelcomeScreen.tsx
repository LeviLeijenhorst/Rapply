import React from "react"
import { ImageBackground, Pressable, StyleSheet, View } from "react-native"
import { Text } from "./Text"
import { colors, radius, safeAreaBottom, safeAreaTop, spacing, typography, vibrate } from "./constants"
import { useNavigation } from "@react-navigation/native"
import LoginArrow from "./svgs/LoginArrow"
import PersonAdd from "./svgs/PersonAdd"
import Logo from "./svgs/Logo"

export default function AuthWelcomeScreen() {
  const navigation = useNavigation<any>()

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("./svgs/authentication_background.png")}
        resizeMode="cover"
        style={styles.bg}
        imageStyle={{ opacity: 0.92 }}
        blurRadius={4}
      >
        <View style={styles.topBar}>
          <Logo width={340} height={110} />
        </View>

        <View style={styles.center}>
          <Text style={styles.welcome}>Welkom bij CoachScribe!</Text>
        </View>

        <View style={styles.bottomButtons}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              vibrate()
              navigation.navigate("Login")
            }}
          >
            <View style={styles.btnRow}>
              <Text style={styles.secondaryBtnText}>Inloggen</Text>
              <LoginArrow />
            </View>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }]}
            onPress={() => {
              vibrate()
              navigation.navigate("Signup")
            }}
          >
            <View style={styles.btnRow}>
              <Text style={styles.primaryBtnText}>Account aanmaken</Text>
              <PersonAdd color={colors.white} />
            </View>
          </Pressable>
        </View>
      </ImageBackground>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  bg: { flex: 1 },
  topBar: {
    paddingHorizontal: spacing.big,
    paddingTop: safeAreaTop + spacing.big,
    alignItems: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.big },
  bottomButtons: { paddingHorizontal: spacing.big, paddingBottom: safeAreaBottom + 24 },
  welcome: {
    fontFamily: typography.fontFamily,
    fontSize: 30,
    textAlign: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  secondaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius,
    borderWidth: 1.5,
    borderColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily,
    fontSize: 16,
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    borderRadius: radius,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
  },
  primaryBtnText: {
    color: colors.white,
    fontFamily: typography.fontFamily,
    fontSize: 16,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
})
