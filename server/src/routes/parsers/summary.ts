import { readOptionalText } from "./scalars"

export type SummaryTemplate = {
  name: string
  sections: { title: string; description: string }[]
}

// Parses an optional summary template payload.
export function readSummaryTemplate(value: unknown): SummaryTemplate | undefined {
  if (!value) return undefined
  const payload = (value || {}) as any
  if (!Array.isArray(payload.sections)) return undefined
  const name = typeof payload.name === "string" ? payload.name.trim() : ""
  const rawSections: { title?: unknown; description?: unknown }[] = payload.sections
  const sections: { title: string; description: string }[] = rawSections
    .map((section) => ({
      title: typeof section?.title === "string" ? section.title.trim() : "",
      description: readOptionalText(section?.description, true) ?? "",
    }))
    .filter((section) => section.title.length > 0)
  if (!sections.length) return undefined
  return { name: name || "Template", sections }
}

