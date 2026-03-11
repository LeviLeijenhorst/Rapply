import { readOptionalText } from "../routes/parsers/scalars"

export type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

// Parses and validates an optional summary template payload.
export function readSummaryTemplate(value: unknown): SummaryTemplate | undefined {
  if (!value) return undefined
  const payload = (value || {}) as Record<string, unknown>
  if (!Array.isArray(payload.sections)) return undefined
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const sections = payload.sections
    .map((section) => ({
      title: typeof (section as any)?.title === "string" ? (section as any).title.trim() : "",
      description: readOptionalText((section as any)?.description, true) ?? "",
    }))
    .filter((section) => section.title.length > 0)
  if (!sections.length) return undefined
  return { name: name || "Template", sections }
}
