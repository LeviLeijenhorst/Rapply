export class ReportGenerationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportGenerationError"
  }
}
