import type { Report } from '../../types/report'
import type { Snippet } from '../../types/snippet'

export type ReportGenerationInput = {
  clientId: string
  templateName: string
  selectedInputIds: string[]
  approvedSnippets: Snippet[]
  clientKnowledge: string
}

export type ReportDraft = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>

