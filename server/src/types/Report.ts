export type ReportFieldType = "programmatic" | "ai" | "manual"

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[]

export type ReportFieldVersion = {
  id: string
  source: "ai_generation" | "ai_regeneration" | "manual_edit" | "chat_update"
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  prompt: string | null
  createdAtUnixMs: number
}

export type StructuredReportField = {
  fieldId: string
  label: string
  fieldType: ReportFieldType
  answer: JsonValue
  factualBasis: string
  reasoning: string
  confidence: number | null
  updatedAtUnixMs: number
  versions: ReportFieldVersion[]
}

export type StructuredReport = {
  templateId: string
  templateName: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
  fields: Record<string, StructuredReportField>
}

export type Report = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  sourceSessionId: string | null
  createdByUserId?: string | null
  primaryAuthorUserId?: string | null
  reportCoachUserIds?: string[]
  reportCoaches?: Array<{
    userId: string
    displayName: string | null
    email: string | null
  }>
  title: string
  reportType: string
  reportText: string
  reportStructuredJson: StructuredReport | null
  reportDate: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
  state: "incomplete" | "needs_review" | "complete"
}
