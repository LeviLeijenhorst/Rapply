export type Report = {
  sessionId: string
  text: string
  updatedAtUnixMs: number
  state: "incomplete" | "needs review" | "complete"
}
