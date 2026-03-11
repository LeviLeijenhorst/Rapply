import { useMemo, useState } from 'react'

import { extractSnippets } from '@/api/snippets/snippetGenerationApi'
import type { InputDataItem, InputNoteItem, InputScreenProps, InputSnippetItem } from '@/screens/session/sessionScreen.types'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { useToast } from '@/toast/ToastProvider'

function selectSnippetsForInput(snippets: InputSnippetItem[], inputId: string): InputSnippetItem[] {
  const normalizedInputId = String(inputId || '').trim()
  if (!normalizedInputId) return []
  return snippets.filter((snippet) => String(snippet.inputId || '').trim() === normalizedInputId)
}

export function useInputScreen(props: InputScreenProps) {
  const { id } = props
  const { data, createNote, createSnippet, updateNote, deleteNote, updateInput, updateSnippet, deleteSnippet } = useLocalAppData()
  const { showErrorToast, showToast } = useToast()
  const [isRegeneratingSnippets, setIsRegeneratingSnippets] = useState(false)

  const appData = data as any

  const session = useMemo<InputDataItem | null>(() => {
    if (!Array.isArray(appData.inputs)) return null
    const rawInput = appData.inputs.find((item: any) => item.id === id)
    if (!rawInput) return null
    return {
      ...rawInput,
      inputId: String(rawInput.inputId || rawInput.id || '').trim() || undefined,
      clientId: String(rawInput.clientId || '').trim() || undefined,
      type: rawInput.type,
    }
  }, [appData.inputs, id])

  const resolvedInputId = session?.inputId || id

  const sessionNotes = useMemo<InputNoteItem[]>(
    () =>
      (Array.isArray(appData.notes) ? appData.notes : [])
        .filter((note: InputNoteItem) => note.sessionId === resolvedInputId)
        .sort((leftNote: InputNoteItem, rightNote: InputNoteItem) => leftNote.createdAtUnixMs - rightNote.createdAtUnixMs),
    [appData.notes, resolvedInputId],
  )

  const sessionSnippets = useMemo<InputSnippetItem[]>(
    () => selectSnippetsForInput(Array.isArray(appData.snippets) ? appData.snippets : [], resolvedInputId),
    [appData.snippets, resolvedInputId],
  )

  const isInputMissing = !session
  const summary = session?.summary || null
  const transcriptionStatus = session?.transcriptionStatus || 'idle'
  const transcript = session?.transcript || null
  const canRegenerateSnippets = sessionSnippets.length === 0 && Boolean(String(transcript || '').trim())

  async function handleRegenerateInputSnippets() {
    if (!session) return

    const sessionTranscript = String(session.transcript || '').trim()
    if (!sessionTranscript || isRegeneratingSnippets) return

    const trajectoryId = String(session.trajectoryId || '').trim()
    if (!trajectoryId) {
      showErrorToast('Koppel deze sessie eerst aan een traject om snippets te genereren.')
      return
    }

    setIsRegeneratingSnippets(true)
    try {
      const generatedSnippets = await extractSnippets({
        inputId: resolvedInputId,
        clientId: String(session.clientId || '').trim() || undefined,
        trajectoryId,
        sourceInputType: session.type === 'written' ? 'written_recap' : 'recording',
        transcript: sessionTranscript,
        itemDate: Number(session.createdAtUnixMs) || Date.now(),
      })

      const existingSnippetIds = new Set((Array.isArray(appData.snippets) ? appData.snippets : []).map((snippet: InputSnippetItem) => snippet.id))
      for (const snippet of generatedSnippets) {
        if (existingSnippetIds.has(snippet.id)) continue
        createSnippet({
          id: snippet.id,
          trajectoryId: snippet.trajectoryId,
          inputId: snippet.inputId,
          itemId: snippet.itemId ?? snippet.inputId,
          field: snippet.field,
          text: snippet.text,
          date: snippet.date,
          status: snippet.status,
          createdAtUnixMs: snippet.createdAtUnixMs,
          updatedAtUnixMs: snippet.updatedAtUnixMs,
        })
      }

      updateInput(session.id, {})

      if (generatedSnippets.length === 0) {
        showToast('Geen snippets gevonden in deze sessie.')
      } else {
        showToast(`${generatedSnippets.length} snippet${generatedSnippets.length === 1 ? '' : 's'} gegenereerd.`)
      }
    } catch (error) {
      console.error('[InputScreen] Snippet regeneration failed', error)
      showErrorToast('Snippets genereren is mislukt. Probeer opnieuw.')
    } finally {
      setIsRegeneratingSnippets(false)
    }
  }

  function handleUpdateSnippetStatus(snippetId: string, status: 'pending' | 'approved' | 'rejected') {
    updateSnippet(snippetId, { status })
  }

  function handleDeleteSnippet(snippetId: string) {
    deleteSnippet(snippetId)
  }

  return {
    session,
    resolvedInputId,
    isInputMissing,
    summary,
    transcriptionStatus,
    transcript,
    canRegenerateSnippets,
    sessionNotes,
    sessionSnippets,
    isRegeneratingSnippets,
    handleRegenerateInputSnippets,
    handleUpdateSnippetStatus,
    handleDeleteSnippet,
    createNote,
    updateNote,
    deleteNote,
  }
}


