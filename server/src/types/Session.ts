export type Session = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  kind: "recording" | "upload" | "written" | "notes" | "intake"
  audioBlobId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcript: string | null
  summary: string | null
  reportDate: string | null
  wvpWeekNumber: string | null
  reportFirstSickDay: string | null
  transcriptionStatus: "idle" | "transcribing" | "generating" | "done" | "error"
  transcriptionError: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
