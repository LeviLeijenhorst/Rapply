export type SessionInputType = "recording" | "uploaded_audio" | "written_recap" | "intake"

export type StructuredSessionSummary = {
  doelstelling: string
  belastbaarheid: string
  belemmeringen: string
  voortgang: string
  arbeidsmarktorientatie: string
}

export type Session = {
  id: string
  clientId: string | null
  trajectoryId: string | null
  title: string
  inputType: SessionInputType
  audioUploadId: string | null
  audioDurationSeconds: number | null
  uploadFileName: string | null
  transcriptText: string | null
  summaryText: string | null
  summaryStructured: StructuredSessionSummary | null
  transcriptionStatus: "idle" | "transcribing" | "generating" | "done" | "error"
  transcriptionError: string | null
  createdAtUnixMs: number
  updatedAtUnixMs: number
}
