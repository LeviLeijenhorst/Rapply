import type { Report } from '../../types/report'
import type { Snippet } from '../../types/snippet'

export type ReportGenerationInput = {
  clientId: string
  templateName: string
  selectedSessionIds: string[]
  approvedSnippets: Snippet[]
  clientKnowledge: string
}

export type ReportDraft = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>
