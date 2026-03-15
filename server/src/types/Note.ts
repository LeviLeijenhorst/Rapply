export type Note = {
  id: string
  clientId: string | null
  sourceInputId: string | null
  sessionId: string
  title: string
  text: string
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
