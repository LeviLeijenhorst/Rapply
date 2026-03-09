import { queryMany, queryOne } from "../db"
import { getDefaultTemplateDescriptionByName } from "./templateDescription"
import type { AppData, SessionInputType, Template, TemplateSection } from "./types"
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
  const clients = await queryMany<{
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
    from public.clients
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const sessions = await queryMany<{
    id: string
    client_id: string | null
    trajectory_id: string | null
    title: string
    input_type: SessionInputType
    audio_upload_id: string | null
    audio_duration_seconds: number | null
    upload_file_name: string | null
    transcript_text: string | null
    summary_text: string | null
    summary_structured_json: unknown | null
    transcription_status: "idle" | "transcribing" | "generating" | "done" | "error"
    transcription_error: string | null
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, client_id, trajectory_id, title, input_type, audio_upload_id, audio_duration_seconds, upload_file_name, transcript_text, summary_text, summary_structured_json, transcription_status, transcription_error, created_at_unix_ms, updated_at_unix_ms
    from public.sessions
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const trajectories = await queryMany<{
    id: string
    client_id: string
    name: string
    service_type: string
    uwv_contact_name: string | null
    uwv_contact_phone: string | null
    uwv_contact_email: string | null
    order_number: string | null
    start_date: string | null
    plan_of_action_json: unknown | null
    max_hours: number
    max_admin_hours: number
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, client_id, name, service_type, uwv_contact_name, uwv_contact_phone, uwv_contact_email, order_number, start_date, plan_of_action_json, max_hours, max_admin_hours, created_at_unix_ms, updated_at_unix_ms
    from public.trajectories
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const activities = await queryMany<{
    id: string
    trajectory_id: string
    session_id: string | null
    template_id: string | null
    name: string
    category: string
    status: "planned" | "executed"
    planned_hours: number | null
    actual_hours: number | null
    source: "manual" | "ai_detected"
    is_admin: boolean
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, trajectory_id, session_id, template_id, name, category, status, planned_hours, actual_hours, source, is_admin, created_at_unix_ms, updated_at_unix_ms
    from public.activities
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const activityTemplates = await queryMany<{
    id: string
    name: string
    description: string
    category: string
    default_hours: number
    is_admin: boolean
    organization_id: string | null
    is_active: boolean
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, name, coalesce(description, '') as description, category, default_hours, is_admin, organization_id, is_active, created_at_unix_ms, updated_at_unix_ms
    from public.activity_templates
    where owner_user_id = $1 or owner_user_id is null
    order by created_at_unix_ms asc
    `,
    [userId],
  )

  const snippets = await queryMany<{
    id: string
    client_id: string
    trajectory_id: string
    source_session_id: string
    snippet_type: string
    text: string
    snippet_date: number
    approval_status: "pending" | "approved" | "rejected"
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, client_id, trajectory_id, source_session_id, snippet_type, text, snippet_date, approval_status, created_at_unix_ms, updated_at_unix_ms
    from public.snippets
    where owner_user_id = $1
    order by snippet_date desc, created_at_unix_ms desc
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
    where owner_user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )

  const reports = await queryMany<{
    id: string
    client_id: string | null
    trajectory_id: string | null
    source_session_id: string | null
    title: string
    report_type: string
    state: "incomplete" | "needs_review" | "complete"
    report_text: string
    report_date: string | null
    first_sick_day: string | null
    wvp_week_number: string | null
    created_at_unix_ms: number
    updated_at_unix_ms: number
  }>(
    `
    select id, client_id, trajectory_id, source_session_id, title, report_type, state, report_text, report_date, first_sick_day, wvp_week_number, created_at_unix_ms, updated_at_unix_ms
    from public.reports
    where owner_user_id = $1
    order by updated_at_unix_ms desc
    `,
    [userId],
  )

  const templates = await queryMany<TemplateRow>(
    `
    select id, name, sections_json, is_saved, created_at_unix_ms, updated_at_unix_ms
    from public.templates
    where owner_user_id = $1
    order by created_at_unix_ms desc
    `,
    [userId],
  )

  const practiceSettingsRow = await queryOne<{
    practice_name: string
    website: string
    visit_address: string
    postal_address: string
    postal_code_city: string
    contact_name: string
    contact_role: string
    contact_phone: string
    contact_email: string
    tint_color: string
    logo_data_url: string | null
    updated_at_unix_ms: number
  }>(
    `
    select practice_name, website, visit_address, postal_address, postal_code_city, contact_name, contact_role, contact_phone, contact_email, tint_color, logo_data_url, updated_at_unix_ms
    from public.practice_settings
    where user_id = $1
    `,
    [userId],
  )

  return {
    clients: clients.map((row) => ({
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
      clientId: row.client_id,
      trajectoryId: row.trajectory_id,
      title: row.title,
      inputType: row.input_type,
      audioUploadId: row.audio_upload_id,
      audioDurationSeconds: row.audio_duration_seconds !== null ? Number(row.audio_duration_seconds) : null,
      uploadFileName: row.upload_file_name,
      transcriptText: row.transcript_text,
      summaryText: row.summary_text,
      summaryStructured:
        row.summary_structured_json && typeof row.summary_structured_json === "object"
          ? {
              doelstelling: String((row.summary_structured_json as any).doelstelling || ""),
              belastbaarheid: String((row.summary_structured_json as any).belastbaarheid || ""),
              belemmeringen: String((row.summary_structured_json as any).belemmeringen || ""),
              voortgang: String((row.summary_structured_json as any).voortgang || ""),
              arbeidsmarktorientatie: String((row.summary_structured_json as any).arbeidsmarktorientatie || ""),
            }
          : null,
      transcriptionStatus: row.transcription_status,
      transcriptionError: row.transcription_error,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    trajectories: trajectories.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      name: row.name,
      serviceType: row.service_type,
      uwvContactName: row.uwv_contact_name,
      uwvContactPhone: row.uwv_contact_phone,
      uwvContactEmail: row.uwv_contact_email,
      orderNumber: row.order_number,
      startDate: row.start_date,
      planOfAction:
        row.plan_of_action_json && typeof row.plan_of_action_json === "object"
          ? {
              documentId: String((row.plan_of_action_json as any).documentId || ""),
            }
          : null,
      maxHours: Number(row.max_hours),
      maxAdminHours: Number(row.max_admin_hours),
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    activities: activities.map((row) => ({
      id: row.id,
      trajectoryId: row.trajectory_id,
      sessionId: row.session_id,
      templateId: row.template_id,
      name: row.name,
      category: row.category,
      status: row.status,
      plannedHours: row.planned_hours !== null ? Number(row.planned_hours) : null,
      actualHours: row.actual_hours !== null ? Number(row.actual_hours) : null,
      source: row.source,
      isAdmin: row.is_admin,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    activityTemplates: activityTemplates.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      category: row.category,
      defaultHours: Number(row.default_hours),
      isAdmin: row.is_admin,
      organizationId: row.organization_id,
      isActive: row.is_active,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    snippets: snippets.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      trajectoryId: row.trajectory_id,
      sourceSessionId: row.source_session_id,
      snippetType: row.snippet_type,
      text: row.text,
      snippetDate: Number(row.snippet_date),
      approvalStatus: row.approval_status,
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
    reports: reports.map((row) => ({
      id: row.id,
      clientId: row.client_id,
      trajectoryId: row.trajectory_id,
      sourceSessionId: row.source_session_id,
      title: row.title,
      reportType: row.report_type,
      state: row.state,
      reportText: row.report_text,
      reportDate: row.report_date,
      firstSickDay: row.first_sick_day,
      wvpWeekNumber: row.wvp_week_number,
      createdAtUnixMs: Number(row.created_at_unix_ms),
      updatedAtUnixMs: Number(row.updated_at_unix_ms),
    })),
    templates: templates.map(mapTemplateRow),
    practiceSettings: {
      practiceName: practiceSettingsRow?.practice_name ?? "",
      website: practiceSettingsRow?.website ?? "",
      visitAddress: practiceSettingsRow?.visit_address ?? "",
      postalAddress: practiceSettingsRow?.postal_address ?? "",
      postalCodeCity: practiceSettingsRow?.postal_code_city ?? "",
      contactName: practiceSettingsRow?.contact_name ?? "",
      contactRole: practiceSettingsRow?.contact_role ?? "",
      contactPhone: practiceSettingsRow?.contact_phone ?? "",
      contactEmail: practiceSettingsRow?.contact_email ?? "",
      tintColor: practiceSettingsRow?.tint_color ?? "#BE0165",
      logoDataUrl: practiceSettingsRow?.logo_data_url ?? null,
      updatedAtUnixMs: Number(practiceSettingsRow?.updated_at_unix_ms ?? 0),
    },
  }
}

