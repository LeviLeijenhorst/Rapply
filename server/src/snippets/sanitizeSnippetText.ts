import { normalizeText } from "../ai/shared/normalize"
import { removeSpeakerLabelsFromOutput } from "../ai/shared/textSanitization"
import { sanitizeMedicalContent } from "./sanitizeMedicalContent"

export function sanitizeSnippetText(value: unknown): string {
  const withoutSpeakerLabels = removeSpeakerLabelsFromOutput(String(value || ""))
  const withoutTimestampPrefix = withoutSpeakerLabels
    .replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/g, "")
    .replace(/^\s*\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
  return sanitizeMedicalContent(normalizeText(withoutTimestampPrefix))
}
