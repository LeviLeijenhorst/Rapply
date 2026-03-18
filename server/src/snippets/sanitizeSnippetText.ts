import { normalizeText } from "../ai/shared/normalize"
import { removeSpeakerLabelsFromOutput } from "../ai/shared/textSanitization"
import { sanitizeMedicalContent } from "./sanitizeMedicalContent"

function normalizeClientTerminology(value: string): string {
  return String(value || "")
    .replace(/\b[Kk]lant(en)?\b/g, (match, plural) => {
      const lower = String(match || "").toLowerCase()
      if (plural) return lower.startsWith("k") && match[0] === "K" ? "Cliënten" : "cliënten"
      return match[0] === "K" ? "Cliënt" : "cliënt"
    })
    .trim()
}

function removeGenericReintegrationPhrases(value: string): string {
  return String(value || "")
    .replace(/\s+als onderdeel van de re-integratieactiviteiten\b/gi, "")
    .replace(/\s+in het kader van de re-integratieactiviteiten\b/gi, "")
    .replace(/\s+binnen de re-integratieactiviteiten\b/gi, "")
    .replace(/\s+voor de re-integratieactiviteiten\b/gi, "")
}

export function sanitizeSnippetText(value: unknown): string {
  const withoutSpeakerLabels = removeSpeakerLabelsFromOutput(String(value || ""))
  const withoutTimestampPrefix = withoutSpeakerLabels
    .replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/g, "")
    .replace(/^\s*\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]\s*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim()
  const normalizedTerminology = normalizeClientTerminology(withoutTimestampPrefix)
  const deGenericized = removeGenericReintegrationPhrases(normalizedTerminology)
  return sanitizeMedicalContent(normalizeText(deGenericized))
}
