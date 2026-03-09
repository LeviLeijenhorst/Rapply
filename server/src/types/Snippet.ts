export type Snippet = {
  id: string
  clientId: string
  trajectoryId: string
  sourceSessionId: string
  snippetType: string
  text: string
  snippetDate: number
  approvalStatus: "pending" | "approved" | "rejected"
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
