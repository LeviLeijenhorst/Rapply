import type { Snippet } from '@/storage/types'

export function buildApprovedSnippetCountByInputId(snippets: Snippet[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const snippet of snippets) {
    if (snippet.status !== 'approved') continue
    const inputId = String(snippet.sourceInputId ?? snippet.inputId ?? '').trim()
    if (!inputId) continue
    map.set(inputId, (map.get(inputId) || 0) + 1)
  }
  return map
}

export function countSelectedApprovedSnippets(
  selectedInputIds: string[],
  approvedSnippetCountByInputId: Map<string, number>,
): number {
  return selectedInputIds.reduce((count, inputId) => count + (approvedSnippetCountByInputId.get(inputId) || 0), 0)
}

export function canGeneratePipelineReport(params: {
  selectedClientId: string | null
  selectedTemplateId: string | null
  selectedInputIds: string[]
  isGenerating: boolean
}): boolean {
  return (
    Boolean(params.selectedClientId) &&
    Boolean(params.selectedTemplateId) &&
    params.selectedInputIds.length > 0 &&
    !params.isGenerating
  )
}

export function toggleSelectionId(currentIds: string[], id: string): string[] {
  if (currentIds.includes(id)) return currentIds.filter((item) => item !== id)
  return [...currentIds, id]
}
