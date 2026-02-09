export const colorTokens = {
  light: {
    pageBackground: '#F8F9F9',
    surface: '#FEFEFE',
    assistantBubble: '#F2F2F2',
    border: '#E0E0E0',
    hoverBackground: 'rgba(38,52,63,0.02)',
    selected: '#BE0165',
    text: '#26343F',
    textStrong: '#1D0A00',
    textSecondary: 'rgba(38,52,63,0.6)',
    badgeBackground: '#FFE5F6',
  },
  dark: {
    pageBackground: '#0E1113',
    surface: '#151A1E',
    assistantBubble: '#1B2025',
    border: '#2B3238',
    hoverBackground: 'rgba(255,255,255,0.06)',
    selected: '#BE0165',
    text: '#E7E9EB',
    textStrong: '#FFFFFF',
    textSecondary: 'rgba(231,233,235,0.7)',
    badgeBackground: 'rgba(190,1,101,0.24)',
  },
} as const

export type ThemeMode = keyof typeof colorTokens

const colorVar = (key: keyof typeof colorTokens.light) => `var(--color-${key})`

export const colors = {
  pageBackground: colorVar('pageBackground'),
  surface: colorVar('surface'),
  assistantBubble: colorVar('assistantBubble'),
  border: colorVar('border'),
  hoverBackground: colorVar('hoverBackground'),
  selected: colorVar('selected'),
  text: colorVar('text'),
  textStrong: colorVar('textStrong'),
  textSecondary: colorVar('textSecondary'),
  badgeBackground: colorVar('badgeBackground'),
} as const

