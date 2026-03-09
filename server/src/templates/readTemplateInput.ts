import type { Template } from "../types/Template"
import { readId, readOptionalText, readText, readUnixMs } from "../routes/parsers/scalars"

function normalizeTemplateName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function inferTemplateCategoryFromName(name: string): Template["category"] {
  const normalized = normalizeTemplateName(name)
  if (!normalized) return "ander-verslag"
  if (normalized === "intake" || normalized === "intakeverslag") return "gespreksverslag"
  if (normalized === "voortgangsgesprek" || normalized === "voortgangsgespreksverslag" || normalized === "voortgangsrapportage") {
    return "gespreksverslag"
  }
  if (
    normalized === "terugkoppelingsrapportclient" ||
    normalized === "terugkoppelingsrapportvoorclient" ||
    normalized === "terugkoppelingclient" ||
    normalized === "terugkoppelingsrapportwerknemer" ||
    normalized === "terugkoppelingsrapportvoorwerknemer" ||
    normalized === "terugkoppelingwerknemer"
  ) {
    return "gespreksverslag"
  }
  return "ander-verslag"
}

function readTemplateSectionInput(value: unknown, index: number): Template["sections"][number] {
  const payload = (value || {}) as Record<string, unknown>
  return {
    id: readId(payload.id, `template.sections[${index}].id`),
    title: readText(payload.title, `template.sections[${index}].title`),
    description: readOptionalText(payload.description, true) ?? "",
  }
}

export function readTemplateInput(value: unknown): Template {
  const payload = (value || {}) as Record<string, unknown>
  const name = readText(payload.name, "template.name")
  const createdAtUnixMs = readUnixMs(payload.createdAtUnixMs, "template.createdAtUnixMs")
  const updatedAtUnixMs = readUnixMs(payload.updatedAtUnixMs ?? payload.createdAtUnixMs, "template.updatedAtUnixMs")
  const category =
    payload.category === "gespreksverslag" || payload.category === "ander-verslag" ? payload.category : inferTemplateCategoryFromName(name)

  if (!Array.isArray(payload.sections)) {
    throw new Error("Missing template.sections")
  }

  return {
    id: readId(payload.id, "template.id"),
    name,
    category,
    description: readOptionalText(payload.description, true) ?? "",
    sections: payload.sections.map((section: unknown, index: number) => readTemplateSectionInput(section, index)),
    isSaved: typeof payload.isSaved === "boolean" ? payload.isSaved : false,
    isDefault: typeof payload.isDefault === "boolean" ? payload.isDefault : false,
    createdAtUnixMs,
    updatedAtUnixMs,
  }
}
