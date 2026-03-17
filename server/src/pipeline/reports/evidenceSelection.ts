import { estimateTokenCount } from "../../ai/shared/textChunking"
import type { Note } from "../../types/Note"
import type { Session } from "../../types/Session"
import type { Snippet } from "../../types/Snippet"

export type SelectedReportEvidence = {
  selectedInputs: Session[]
  selectedNotes: Note[]
  approvedSnippets: Snippet[]
  evidenceByFieldId: Map<string, string[]>
  totalEstimatedTokens: number
}

const maxEvidenceTokens = 16_000

function normalizeText(value: unknown): string {
  return String(value || "").trim()
}

function readSnippetLabels(snippet: Snippet): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  const candidates = [...(Array.isArray(snippet.fieldIds) ? snippet.fieldIds : []), snippet.fieldId, snippet.snippetType]
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

export function selectEvidenceForReport(params: {
  inputs: Session[]
  notes: Note[]
  snippets: Snippet[]
  selectedInputIds: string[]
  selectedNoteIds: string[]
}): SelectedReportEvidence {
  const inputIdSet = new Set(params.selectedInputIds.map((id) => String(id || "").trim()).filter(Boolean))
  const noteIdSet = new Set(params.selectedNoteIds.map((id) => String(id || "").trim()).filter(Boolean))

  const selectedInputs = params.inputs.filter((input) => inputIdSet.has(input.id))
  const selectedNotes = params.notes.filter((note) => noteIdSet.has(note.id))
  const approvedSnippets = params.snippets.filter((snippet) => {
    const sourceInputId = normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
    return snippet.approvalStatus === "approved" && inputIdSet.has(sourceInputId)
  })

  const evidenceByFieldId = new Map<string, string[]>()
  const addEvidence = (fieldId: string, value: string) => {
    const normalizedFieldId = normalizeText(fieldId)
    const normalizedValue = normalizeText(value)
    if (!normalizedFieldId || !normalizedValue) return
    const existing = evidenceByFieldId.get(normalizedFieldId) ?? []
    existing.push(normalizedValue)
    evidenceByFieldId.set(normalizedFieldId, existing)
  }

  for (const snippet of approvedSnippets) {
    for (const fieldId of readSnippetLabels(snippet)) {
      addEvidence(fieldId, snippet.text)
    }
  }

  const noteEvidenceLines = selectedNotes.map((note) => `${normalizeText(note.title)}\n${normalizeText(note.text)}`.trim()).filter(Boolean)
  if (noteEvidenceLines.length > 0) {
    evidenceByFieldId.set("general_notes", noteEvidenceLines)
  }

  const snippetTokenEstimate = approvedSnippets.reduce((sum, snippet) => sum + estimateTokenCount(normalizeText(snippet.text)), 0)
  const noteTokenEstimate = noteEvidenceLines.reduce((sum, line) => sum + estimateTokenCount(line), 0)
  const totalEstimatedTokens = snippetTokenEstimate + noteTokenEstimate

  if (totalEstimatedTokens > maxEvidenceTokens) {
    throw new Error(
      `De geselecteerde evidence is te groot (${totalEstimatedTokens} tokens). Selecteer minder inputs/notities en probeer opnieuw.`,
    )
  }

  return {
    selectedInputs,
    selectedNotes,
    approvedSnippets,
    evidenceByFieldId,
    totalEstimatedTokens,
  }
}

