export type Snippet = {
  id: string
  trajectoryId: string
  sourceSessionId: string
  snippetType: string
  text: string
  date: number
  approvalStatus: "pending" | "approved" | "rejected"
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
