export type Snippet = {
  id: string
  clientId: string
  trajectoryId: string | null
  sourceSessionId: string
  sourceInputId?: string | null
  fieldIds?: string[]
  snippetType: string
  fieldId: string
  text: string
  snippetDate: number
  approvalStatus: "pending" | "approved" | "rejected"
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
