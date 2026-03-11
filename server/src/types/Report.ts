export type Report = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  sourceSessionId: string | null
  title: string
  reportType: string
  reportText: string
  reportDate: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
  state: "incomplete" | "needs_review" | "complete"
}
