import { normalizeText } from "../ai/shared/normalize"

const medicalSanitizationRules: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\b(depressie|depressief)\b/gi, replacement: "mentale belastingsklachten" },
  { pattern: /\b(adhd|autisme|ptss|burn[-\s]?out|angststoornis)\b/gi, replacement: "belastbaarheidsfactor" },
  { pattern: /\b(psychiater|psycholoog|therapie|medicatie)\b/gi, replacement: "ondersteuning" },
  { pattern: /\b(ziekte|diagnose|stoornis)\b/gi, replacement: "situatie" },
  { pattern: /\b(pijn|migraine|chronisch)\b/gi, replacement: "fysieke belastingsklachten" },
]

// Rewrites medically sensitive wording into functionally relevant language for reports/snippets.
export function sanitizeMedicalContent(value: string): string {
  let sanitized = normalizeText(value)
  for (const rule of medicalSanitizationRules) {
    sanitized = sanitized.replace(rule.pattern, rule.replacement)
  }
  return normalizeText(sanitized)
}
