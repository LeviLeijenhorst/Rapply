export class SummaryGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SummaryGenerationError"
  }
}
