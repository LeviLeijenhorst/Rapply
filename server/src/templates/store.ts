import { execute, queryMany } from "../db"
import type { Template, TemplateSection } from "../types/Template"
import { getReintegrationDefaultTemplateSectionsByName } from "./defaultTemplates"
import { getDefaultTemplateDescriptionByName } from "./getDefaultTemplateDescriptionByName"

type TemplateRow = {
  id: string
  name: string
  sections_json: unknown
  is_saved: boolean
  created_at_unix_ms: number
  updated_at_unix_ms: number
}

const legacyDefaultDescriptionByName: Record<string, string[]> = {
  "arbeidsdeskundig rapport": [
    "Rapportage vanuit arbeidsdeskundige analyse en belastbaarheid.",
    "Arbeidsdeskundige bevindingen over belastbaarheid en passend werk.",
  ],
}

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

function normalizeDefaultTemplateDescription(name: string, description: string, isDefault: boolean): string {
  const trimmed = description.trim()
  if (!isDefault || !trimmed) return trimmed
  const normalizedName = name.trim().toLowerCase()
  const legacyValues = legacyDefaultDescriptionByName[normalizedName] ?? []
  if (!legacyValues.includes(trimmed)) return trimmed
  return ""
}

function hasLegacyGenericTemplateSections(sections: TemplateSection[]): boolean {
  if (sections.length !== 3) return false
  const normalizedTitles = sections.map((section) => normalizeTemplateName(section.title))
  return normalizedTitles[0] === "situatie" && normalizedTitles[1] === "analyse" && normalizedTitles[2] === "adviesenvervolgstappen"
}

function mapTemplateRow(row: TemplateRow): Template {
  const rawSectionsPayload = typeof row.sections_json === "string" ? JSON.parse(row.sections_json) : row.sections_json
  const rawSections = Array.isArray(rawSectionsPayload)
    ? (rawSectionsPayload as TemplateSection[])
    : Array.isArray((rawSectionsPayload as any)?.sections)
      ? (((rawSectionsPayload as any).sections as TemplateSection[]) ?? [])
      : []
  const descriptionRaw = typeof (rawSectionsPayload as any)?.description === "string" ? ((rawSectionsPayload as any).description as string) : ""
  const categoryRaw = (rawSectionsPayload as any)?.category
  const isDefaultRaw = typeof (rawSectionsPayload as any)?.isDefault === "boolean" ? ((rawSectionsPayload as any).isDefault as boolean) : false
  const category = categoryRaw === "gespreksverslag" || categoryRaw === "ander-verslag" ? categoryRaw : inferTemplateCategoryFromName(row.name)
  const normalizedSections = hasLegacyGenericTemplateSections(rawSections)
    ? getReintegrationDefaultTemplateSectionsByName(row.name)?.map((section, index) => ({
        id: `${row.id}-section-${index + 1}`,
        title: section.title,
        description: section.description,
      })) ?? rawSections
    : rawSections
  const normalizedDescription = normalizeDefaultTemplateDescription(row.name, descriptionRaw, isDefaultRaw)
  const description = normalizedDescription || getDefaultTemplateDescriptionByName(row.name)
  return {
    id: row.id,
    name: row.name,
    category,
    description,
    sections: normalizedSections,
    isSaved: row.is_saved,
    isDefault: isDefaultRaw,
    createdAtUnixMs: Number(row.created_at_unix_ms),
    updatedAtUnixMs: Number(row.updated_at_unix_ms),
  }
}

export async function listTemplates(userId: string): Promise<Template[]> {
  const rows = await queryMany<TemplateRow>(
    `
    select id, name, sections_json, is_saved, created_at_unix_ms, updated_at_unix_ms
    from public.templates
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )
  return rows.map(mapTemplateRow)
}

export async function createTemplate(userId: string, template: Template): Promise<void> {
  await execute(
    `
    insert into public.templates (id, owner_user_id, name, sections_json, is_saved, created_at_unix_ms, updated_at_unix_ms)
    values ($1, $2, $3, $4::jsonb, $5, $6, $7)
    on conflict (id) do update
      set name = excluded.name,
          sections_json = excluded.sections_json,
          is_saved = excluded.is_saved,
          updated_at_unix_ms = excluded.updated_at_unix_ms
      where public.templates.owner_user_id = excluded.owner_user_id
    `,
    [
      template.id,
      userId,
      template.name,
      JSON.stringify({ category: template.category, description: template.description, sections: template.sections, isDefault: template.isDefault }),
      template.isSaved,
      template.createdAtUnixMs,
      template.updatedAtUnixMs,
    ],
  )
}

export async function updateTemplate(userId: string, template: Template): Promise<void> {
  await execute(
    `
    update public.templates
    set name = $1,
        sections_json = $2::jsonb,
        is_saved = $3,
        updated_at_unix_ms = $4
    where owner_user_id = $5 and id = $6
    `,
    [
      template.name,
      JSON.stringify({ category: template.category, description: template.description, sections: template.sections, isDefault: template.isDefault }),
      template.isSaved,
      template.updatedAtUnixMs,
      userId,
      template.id,
    ],
  )
}

export async function deleteTemplate(userId: string, id: string): Promise<void> {
  await execute(`delete from public.templates where owner_user_id = $1 and id = $2`, [userId, id])
}
