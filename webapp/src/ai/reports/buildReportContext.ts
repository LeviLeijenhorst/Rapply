import type { Snippet } from '../../types/snippet'

export function buildReportContext(params: {
  templateName: string
  approvedSnippets: Snippet[]
  clientKnowledge: string
}): string {
  const snippetsText = params.approvedSnippets.map((snippet) => `- ${snippet.text}`).join('\n')
  return `Template: ${params.templateName}\n\nApproved snippets:\n${snippetsText}\n\nClient knowledge:\n${params.clientKnowledge}`
}
