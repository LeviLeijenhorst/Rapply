// Parses a required text identifier from request input.
export function readId(value: unknown, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    throw new Error(`Missing ${fieldName}`)
  }
  return text
}

// Parses an optional text identifier from request input.
export function readOptionalId(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const text = typeof value === "string" ? value.trim() : ""
  return text || undefined
}

// Parses a required non-empty text field from request input.
export function readText(value: unknown, fieldName: string): string {
  const text = typeof value === "string" ? value.trim() : ""
  if (!text) {
    throw new Error(`Missing ${fieldName}`)
  }
  return text
}

// Parses a required numeric field from request input.
export function readRequiredNumber(value: unknown, fieldName: string): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`Missing ${fieldName}`)
  }
  return Number(numeric)
}

// Parses a required integer field from request input.
export function readRequiredInteger(value: unknown, fieldName: string): number {
  const numeric = readRequiredNumber(value, fieldName)
  if (!Number.isInteger(numeric)) {
    throw new Error(`Invalid ${fieldName}`)
  }
  return numeric
}

// Parses an optional text field and supports explicit null semantics.
export function readOptionalText(value: unknown, allowEmpty = false): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const text = typeof value === "string" ? value.trim() : ""
  if (!text && !allowEmpty) return null
  return text
}

// Parses an optional numeric field and supports explicit null semantics.
export function readOptionalNumber(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) return null
  return Number(numeric)
}

// Parses an optional integer field and supports explicit null semantics.
export function readOptionalInteger(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) return null
  return Number(numeric)
}

// Parses a required Unix timestamp value in milliseconds.
export function readUnixMs(value: unknown, fieldName: string): number {
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error(`Missing ${fieldName}`)
  }
  return Number(numeric)
}

