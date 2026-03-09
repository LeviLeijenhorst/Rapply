import { normalizeText } from "./normalize"

const minimumChunkCharacterLength = 2_000

export function estimateTokenCount(value: string): number {
  const trimmed = normalizeText(value)
  if (!trimmed) return 0
  return Math.ceil(trimmed.length / 4)
}

export function splitOversizedLine(line: string, maxAllowedTokens: number): string[] {
  const trimmed = normalizeText(line)
  if (!trimmed) return [""]
  if (estimateTokenCount(trimmed) <= maxAllowedTokens) return [trimmed]
  const roughCharacterBudget = Math.max(minimumChunkCharacterLength, maxAllowedTokens * 3)
  const parts: string[] = []
  let cursor = 0
  while (cursor < trimmed.length) {
    const nextCursor = Math.min(trimmed.length, cursor + roughCharacterBudget)
    parts.push(trimmed.slice(cursor, nextCursor))
    cursor = nextCursor
  }
  return parts
}

export function splitTextByEstimatedTokenBudget(params: { text: string; maxAllowedTokens: number }): string[] {
  const text = normalizeText(params.text)
  const maxAllowedTokens = Math.max(500, Math.floor(params.maxAllowedTokens))
  if (!text) return []

  const lines = text.split("\n")
  const chunks: string[] = []
  let pendingLines: string[] = []
  let pendingTokens = 0

  const flushPending = () => {
    const chunk = normalizeText(pendingLines.join("\n"))
    if (chunk) chunks.push(chunk)
    pendingLines = []
    pendingTokens = 0
  }

  for (const rawLine of lines) {
    const line = String(rawLine || "")
    const lineTokens = estimateTokenCount(line) + 1
    if (lineTokens > maxAllowedTokens) {
      if (pendingLines.length > 0) flushPending()
      for (const part of splitOversizedLine(line, maxAllowedTokens)) {
        const normalizedPart = normalizeText(part)
        if (normalizedPart) chunks.push(normalizedPart)
      }
      continue
    }

    if (pendingTokens + lineTokens > maxAllowedTokens && pendingLines.length > 0) {
      flushPending()
    }

    pendingLines.push(line)
    pendingTokens += lineTokens
  }

  if (pendingLines.length > 0) flushPending()
  return chunks
}
