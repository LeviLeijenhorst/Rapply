import { queryMany, queryOne } from "../db"
import { getDefaultTemplateDescriptionByName } from "./templateDescription"
import type { AppData, SessionKind, Template, TemplateSection } from "./types"
import { getReintegrationDefaultTemplateSectionsByName } from "../templates/defaultTemplates"

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

function normalizeDefaultTemplateDescription(name: string, description: string, isDefault: boolean): string {
  const trimmed = description.trim()
  if (!isDefault || !trimmed) return trimmed
  const normalizedName = name.trim().toLowerCase()
  const legacyValues = legacyDefaultDescriptionByName[normalizedName] ?? []
  if (!legacyValues.includes(trimmed)) return trimmed
  return ""
}

function normalizeTemplateSectionTitle(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
}

function inferTemplateCategoryFromName(name: string): Template["category"] {
  const normalized = normalizeTemplateSectionTitle(name)
  if (!normalized) return "ander-verslag"
  if (normalized === "intake" || normalized === "intakeverslag") return "gespreksverslag"
  if (
    normalized === "voortgangsgesprek" ||
    normalized === "voortgangsgespreksverslag" ||
    normalized === "voortgangsrapportage"
  ) {
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

function hasLegacyGenericTemplateSections(sections: TemplateSection[]): boolean {
  if (sections.length !== 3) return false
  const normalizedTitles = sections.map((section) => normalizeTemplateSectionTitle(section.title))
  return (
    normalizedTitles[0] === "situatie" &&
    normalizedTitles[1] === "analyse" &&
    normalizedTitles[2] === "adviesenvervolgstappen"
  )
}

// Normalizes the stored sections_json payload into one template domain object.
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

// Loads all app-domain records for one user in a single response shape.
export async function readAppData(userId: string): Promise<AppData> {
  const coachees = await queryMany<{
    id: string
    name: string
    client_details: string
    employer_details: string
    first_sick_day: string
    created_at_unix_ms: number
    updated_at_unix_ms: number
    is_archived: boolean
  }>(
    `
    select id, name, coalesce(client_details, '') as client_details, coalesce(employer_details, '') as employer_details, coalesce(first_sick_day, '') as first_sick_day, created_at_unix_ms, updated_at_unix_ms, is_archived
    from public.coachees
    where user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const sessions = await queryMany<{
    id: string
    coachee_id: string | null
    title: string
    kind: SessionKind
    audio_blob_id: string | null
    audio_duration_seconds: number | null
    upload_file_name: string | null
    transcript: string | null
    summary: string | null
    report_date: string | null
    wvp_week_number: string | null
    report_first_sick_day: string | null
    transcription_status: "idle" | "transcribing" | "generating" | "done" | "error"
    transcription_error: string | null
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, coachee_id, title, kind, audio_blob_id, audio_duration_seconds, upload_file_name, transcript, summary, report_date, wvp_week_number, report_first_sick_day, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    from public.coachee_sessions
    where user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const notes = await queryMany<{
    id: string
    session_id: string
    title: string | null
    text: string
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, session_id, coalesce(title, '') as title, text, created_at_unix_ms, updated_at_unix_ms
    from public.session_notes
    where user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )

  const writtenReports = await queryMany<{
    session_id: string
    text: string
    updated_at_unix_ms: number
  }>(
    `
    select session_id, text, updated_at_unix_ms
    from public.session_written_reports
    where user_id = $1
    `,
    [userId],
  )

  const templates = await queryMany<TemplateRow>(
    `
    select id, name, sections_json, is_saved, created_at_unix_ms, updated_at_unix_ms
    from public.templates
    where user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const practiceSettingsRow = await queryOne<{
    practice_name: string
    website: string
    tint_color: string
    logo_data_url: string | null
    updated_at_unix_ms: number
  }>(
    `
    select practice_name, website, tint_color, logo_data_url, updated_at_unix_ms
    from public.practice_settings
    where user_id = $1
    `,
    [userId],
  )

  return {
    coachees: coachees.map((row) => ({
      id: row.id,
      name: row.name,
      clientDetails: row.client_details ?? "",
      employerDetails: row.employer_details ?? "",
      firstSickDay: row.first_sick_day ?? "",
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
      isArchived: row.is_archived,
    })),
    sessions: sessions.map((row) => ({
      id: row.id,
      coacheeId: row.coachee_id,
      title: row.title,
      kind: row.kind,
      audioBlobId: row.audio_blob_id,
      audioDurationSeconds: row.audio_duration_seconds !== null ? Number(row.audio_duration_seconds) : null,
      uploadFileName: row.upload_file_name,
      transcript: row.transcript,
      summary: row.summary,
      reportDate: row.report_date,
      wvpWeekNumber: row.wvp_week_number,
      reportFirstSickDay: row.report_first_sick_day,
      transcriptionStatus: row.transcription_status,
      transcriptionError: row.transcription_error,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    notes: notes.map((row) => ({
      id: row.id,
      sessionId: row.session_id,
      title: row.title ?? "",
      text: row.text,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    writtenReports: writtenReports.map((row) => ({
      sessionId: row.session_id,
      text: row.text,
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    templates: templates.map(mapTemplateRow),
    practiceSettings: {
      practiceName: practiceSettingsRow?.practice_name ?? "",
      website: practiceSettingsRow?.website ?? "",
      tintColor: practiceSettingsRow?.tint_color ?? "#BE0165",
      logoDataUrl: practiceSettingsRow?.logo_data_url ?? null,
      updatedAtUnixMs: Number(practiceSettingsRow?.updated_at_unix_ms ?? 0),
    },
  }
}
