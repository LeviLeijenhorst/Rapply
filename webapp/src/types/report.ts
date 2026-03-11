export type ReportStatus = 'incomplete' | 'needs_review' | 'complete'

export type Report = {
  id: string
  clientId: string
  templateName: string
  title: string
  text: string
  selectedInputIds: string[]
  selectedSnippetIds: string[]
  status: ReportStatus
  createdAt: number
  updatedAt: number
}

