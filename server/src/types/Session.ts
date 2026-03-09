export type Session = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  inputType: "recording" | "uploaded_audio" | "written_recap" | "intake"
  audioUploadId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcriptText: string | null
  summaryText: string | null
  transcriptionStatus: "idle" | "transcribing" | "generating" | "done" | "error"
  transcriptionError: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
