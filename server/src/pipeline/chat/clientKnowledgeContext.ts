import { normalizeText } from "../../ai/shared/normalize"
import type { Note } from "../../types/Note"
import type { Session } from "../../types/Session"
import type { Snippet } from "../../types/Snippet"

function formatDutchDate(unixMs: number | null): string {
  if (!Number.isFinite(Number(unixMs))) return "onbekende datum"
  return new Date(Number(unixMs)).toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatInputTypeLabel(inputType: Session["inputType"] | "" | null | undefined): string {
  if (inputType === "recording" || inputType === "uploaded_audio") return "Opgenomen gesprek"
  if (inputType === "spoken_recap") return "Gesproken recap"
  if (inputType === "written_recap") return "Geschreven recap"
  if (inputType === "uploaded_document") return "Geüpload document"
  if (inputType === "intake") return "Intake"
  return "Input"
}

function readSnippetInputId(snippet: Snippet): string {
  return normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
}

type ClientKnowledgeGroup = {
  sortUnixMs: number
  heading: string
  lines: string[]
}

// Builds prompt-safe grouped client knowledge by input type/date, with notes included as dated items.
export function buildGroupedClientKnowledgeContext(params: {
  clientId: string
  inputs: Session[]
  snippets: Snippet[]
  notes: Note[]
  inputId?: string | null
}): string {
  const normalizedClientId = normalizeText(params.clientId)
  const normalizedInputId = normalizeText(params.inputId)

  const relevantInputs = params.inputs.filter((input) => {
    if (normalizeText(input.clientId) !== normalizedClientId) return false
    if (!normalizedInputId) return true
    return input.id === normalizedInputId
  })
  const inputById = new Map(relevantInputs.map((input) => [input.id, input]))

  const groups: ClientKnowledgeGroup[] = []

  for (const input of relevantInputs) {
    const approvedSnippetLines = params.snippets
      .filter((snippet) => snippet.approvalStatus === "approved")
      .filter((snippet) => readSnippetInputId(snippet) === input.id)
      .map((snippet) => `- ${normalizeText(snippet.text)}`)
      .filter(Boolean)

    if (approvedSnippetLines.length === 0) continue

    groups.push({
      sortUnixMs: Number(input.createdAtUnixMs) || 0,
      heading: `${formatInputTypeLabel(input.inputType)} op ${formatDutchDate(input.createdAtUnixMs)}`,
      lines: approvedSnippetLines,
    })
  }

  const relevantNotes = params.notes.filter((note) => {
    if (normalizeText(note.clientId) !== normalizedClientId) return false
    if (!normalizedInputId) return true
    const noteInputId = normalizeText(note.sourceInputId)
    return !noteInputId || noteInputId === normalizedInputId
  })

  for (const note of relevantNotes) {
    const noteInputId = normalizeText(note.sourceInputId)
    const linkedInput = noteInputId ? inputById.get(noteInputId) ?? null : null
    const noteHeadingPrefix = linkedInput ? `Notitie bij ${formatInputTypeLabel(linkedInput.inputType)}` : "Notitie"
    const noteLines = [normalizeText(note.title), normalizeText(note.text)]
      .filter(Boolean)
      .map((line, index) => (index === 0 && normalizeText(note.text) ? `- ${line}: ${normalizeText(note.text)}` : `- ${line}`))

    groups.push({
      sortUnixMs: Number(note.updatedAtUnixMs) || Number(note.createdAtUnixMs) || 0,
      heading: `${noteHeadingPrefix} op ${formatDutchDate(Number(note.updatedAtUnixMs) || Number(note.createdAtUnixMs) || 0)}`,
      lines: noteLines.slice(0, 1),
    })
  }

  groups.sort((left, right) => left.sortUnixMs - right.sortUnixMs)

  return [
    "Samenvatting van relevante cliëntinformatie",
    "",
    ...(groups.length > 0
      ? groups.flatMap((group) => [group.heading, ...group.lines, ""])
      : ["- Geen goedgekeurde snippets of notities beschikbaar."]),
  ]
    .join("\n")
    .trim()
}
