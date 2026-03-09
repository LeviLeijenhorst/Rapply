export type ActivityStatus = "planned" | "executed"
export type ActivitySource = "manual" | "ai_detected"

export type Activity = {
  id: string
  trajectoryId: string
  sessionId: string | null
  templateId: string | null
  name: string
  category: string
  status: ActivityStatus
  plannedHours: number | null
  actualHours: number | null
  source: ActivitySource
  isAdmin: boolean
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
