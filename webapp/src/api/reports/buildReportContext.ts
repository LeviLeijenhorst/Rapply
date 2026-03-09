import type { Snippet } from '../../types/snippet'
import { classifySnippetType } from '../snippets/classifySnippetType'

export function buildReportContext(params: {
  templateName: string
  approvedSnippets: Snippet[]
  clientKnowledge: string
}): string {
  const snippetsText = params.approvedSnippets
    .filter((snippet) => snippet.status === 'approved')
    .filter((snippet) => {
      const field = String((snippet as any).field ?? (snippet as any).type ?? '')
      return classifySnippetType(field) === 'report'
    })
    .map((snippet) => `- ${snippet.text}`)
    .join('\n')

  return `Template: ${params.templateName}\n\nApproved snippets:\n${snippetsText}\n\nClient knowledge:\n${params.clientKnowledge}`
}
