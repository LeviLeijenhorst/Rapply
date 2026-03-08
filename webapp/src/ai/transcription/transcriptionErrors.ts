export class TranscriptionPipelineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionPipelineError'
  }
}
