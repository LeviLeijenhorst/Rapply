import { useEffect, useMemo, useState } from 'react'

import { extractSnippets } from '@/api/snippets/snippetGenerationApi'
import type { InputDataItem, InputNoteItem, InputScreenProps, InputSnippetItem } from '@/screens/session/sessionScreen.types'
import { resolveInputSummaryText } from '@/screens/session/sessionSummary'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { useToast } from '@/toast/ToastProvider'

function selectSnippetsForInput(snippets: InputSnippetItem[], inputId: string): InputSnippetItem[] {
  const normalizedInputId = String(inputId || '').trim()
  if (!normalizedInputId) return []
  return snippets.filter((snippet) => String(snippet.inputId || '').trim() === normalizedInputId)
}

function isWrittenInputType(value: unknown): boolean {
  const normalizedType = String(value || '').trim()
  return normalizedType === 'written' || normalizedType === 'written-recap'
}

export function useInputScreen(props: InputScreenProps) {
  const { id } = props
  const { data, createNote, createSnippet, updateNote, deleteNote, updateInput, updateSnippet, deleteSnippet } = useLocalAppData()
  const { showErrorToast, showToast } = useToast()
  const [isRegeneratingSnippets, setIsRegeneratingSnippets] = useState(false)
  const [isSnippetStateSettling, setIsSnippetStateSettling] = useState(false)

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
  const isWrittenInput = isWrittenInputType(session?.type)
  const isUploadedDocument = session?.type === 'uploaded-document'
  const summary = useMemo(() => {
    if (isWrittenInput) return null
    if (session?.type === 'uploaded-document') {
      return String(session.transcript || '').trim() || null
    }
    return resolveInputSummaryText(session)
  }, [isWrittenInput, session?.summary, session?.summaryStructured, session?.transcript, session?.type])
  const transcriptionStatus = isWrittenInput ? 'idle' : (session?.transcriptionStatus || 'idle')
  const transcript = isWrittenInput ? null : (session?.transcript || null)
  const hasTranscript = Boolean(String(transcript || '').trim())
  const visibleSessionSnippets = isWrittenInput ? [] : sessionSnippets

  useEffect(() => {
    if (isWrittenInput) {
      setIsSnippetStateSettling(false)
      return undefined
    }
    const isGeneratingPipeline = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'
    if (isGeneratingPipeline && sessionSnippets.length === 0 && hasTranscript) {
      setIsSnippetStateSettling(true)
      return
    }
    if (transcriptionStatus === 'done' && sessionSnippets.length === 0 && hasTranscript) {
      const timerId = setTimeout(() => {
        setIsSnippetStateSettling(false)
      }, 900)
      return () => clearTimeout(timerId)
    }
    setIsSnippetStateSettling(false)
    return undefined
  }, [hasTranscript, isWrittenInput, transcriptionStatus, sessionSnippets.length])

  const canRegenerateSnippets = !isWrittenInput && hasTranscript && !isSnippetStateSettling

  async function handleRegenerateInputSnippets() {
    if (!session) return
    if (isWrittenInput) return

    const sessionTranscript = String(session.transcript || '').trim()
    if (!sessionTranscript || isRegeneratingSnippets) return

    setIsRegeneratingSnippets(true)
    try {
      const generatedSnippets = await extractSnippets({
        inputId: resolvedInputId,
        clientId: String(session.clientId || '').trim() || undefined,
        trajectoryId: session.trajectoryId ?? null,
        sourceInputType:
          isWrittenInputType(session.type)
            ? 'written_recap'
            : session.type === 'uploaded-document'
              ? 'uploaded_document'
              : 'recording',
        transcript: sessionTranscript,
        itemDate: Number(session.createdAtUnixMs) || Date.now(),
      })

      for (const existingSnippet of sessionSnippets) {
        deleteSnippet(existingSnippet.id)
      }

      for (const snippet of generatedSnippets) {
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
    const currentSnippet = sessionSnippets.find((snippet) => snippet.id === snippetId) || null
    if (!currentSnippet) return
    const nextStatus = currentSnippet.status === status ? 'pending' : status
    updateSnippet(snippetId, { status: nextStatus })
  }

  function handleDeleteSnippet(snippetId: string) {
    deleteSnippet(snippetId)
  }

  function handleSaveSnippetText(snippetId: string, text: string) {
    updateSnippet(snippetId, { text: String(text || '') })
  }

  function handleSaveSummary(nextSummary: string) {
    if (!session) return
    updateInput(session.id, {
      summary: String(nextSummary || ''),
      summaryStructured: null,
    })
  }

  return {
    session,
    resolvedInputId,
    isInputMissing,
    isWrittenInput,
    isUploadedDocument,
    summary,
    transcriptionStatus,
    transcript,
    canRegenerateSnippets,
    sessionNotes,
    sessionSnippets: visibleSessionSnippets,
    isSnippetStateSettling,
    isRegeneratingSnippets,
    handleRegenerateInputSnippets,
    handleUpdateSnippetStatus,
    handleSaveSnippetText,
    handleDeleteSnippet,
    handleSaveSummary,
    createNote,
    updateNote,
    deleteNote,
  }
}


