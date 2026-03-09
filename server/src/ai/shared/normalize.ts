export function normalizeText(value: unknown): string {
  return String(value || "").trim()
}

export function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", "."))
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}
