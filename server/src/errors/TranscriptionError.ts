export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TranscriptionError"
  }
}
