import { Platform, StatusBar, Vibration } from "react-native"

export const colors = {
  orange: "#FF5B03",
  pressedOverlay: "#FF5B0315",
  white: "#FEFEFE",
  backgroundLight: "#F6F6F6",
  searchBar: "#E0E0E0",
  textPrimary: "#1D0A00",
  textSecondary: "#656565",
  textOrange: "#FF5B03",
}

export const spacing = { small: 12, big: 16 }
export const typography = {
  fontFamily: "catamaranRegular",
  monospaceFontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
  textSize: 16,
}
export const radius = 12
export const safeAreaTop = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0
export const safeAreaBottom = Platform.OS === "android" ? 28 : 24
export const tabBarTotalHeight = 48 + spacing.small + 10 + safeAreaBottom

export function vibrate() {
  if (Platform.OS === "android") {
    Vibration.vibrate(1)
  }
}
