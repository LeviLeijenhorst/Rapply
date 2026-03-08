export const brandColors = {
  primary: "#BE0165",
  primaryHover: "#A50058",
  primarySubtle: "rgba(190,1,101,0.08)",
  coachscribeGradientStart: "#7E0056",
  coachscribeGradientEnd: "#C30064",
  white: "#FFFFFF",
  neutral700: "#656565",
} as const;

export const semanticColorTokens = {
  light: {
    pageBackground: "#F7F5F8",
    surface: "#FEFEFE",
    assistantBubble: "#F2F2F2",
    border: "#E0E0E0",
    hoverBackground: "rgba(38,52,63,0.06)",
    selected: brandColors.primary,
    text: "#26343F",
    textStrong: "#1D0A00",
    textSecondary: "rgba(38,52,63,0.6)",
    badgeBackground: "#FFE5F6",
  },
  dark: {
    pageBackground: "#0E1113",
    surface: "#151A1E",
    assistantBubble: "#1B2025",
    border: "#2B3238",
    hoverBackground: "rgba(255,255,255,0.1)",
    selected: brandColors.primary,
    text: "#E7E9EB",
    textStrong: "#FFFFFF",
    textSecondary: "rgba(231,233,235,0.7)",
    badgeBackground: "rgba(190,1,101,0.24)",
  },
} as const;
