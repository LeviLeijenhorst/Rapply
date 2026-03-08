import type { Report } from '../../types/report'
import type { Session } from '../../types/session'
import type { Snippet } from '../../types/snippet'

export function buildClientChatContext(params: {
  sessions: Session[]
  snippets: Snippet[]
  reports: Report[]
  clientKnowledge: string
}): string {
  const summaries = params.sessions.map((session) => `- ${session.title}: ${session.summary || ''}`).join('\n')
  const approved = params.snippets.filter((snippet) => snippet.status === 'approved').map((snippet) => `- ${snippet.text}`).join('\n')
  const reportsText = params.reports.map((report) => `- ${report.title}`).join('\n')
  return `Session summaries:\n${summaries}\n\nApproved snippets:\n${approved}\n\nClient knowledge:\n${params.clientKnowledge}\n\nReports:\n${reportsText}`
}
