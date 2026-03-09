import { semanticColorTokens } from '../../design/tokens/colors'

export const colorTokens = semanticColorTokens

export type ThemeMode = keyof typeof colorTokens

const colorVar = (key: keyof typeof colorTokens.light) => `var(--color-${key}, ${colorTokens.light[key]})`

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




