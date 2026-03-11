import { useMemo, useState } from 'react'

import { extractSnippets } from '@/api/snippets/snippetGenerationApi'
import type { SessionDataItem, SessionNoteItem, SessionScreenProps, SessionSnippetItem } from '@/screens/session/sessionScreen.types'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { useToast } from '@/toast/ToastProvider'

function selectSnippetsForInput(snippets: SessionSnippetItem[], inputId: string): SessionSnippetItem[] {
  const normalizedInputId = String(inputId || '').trim()
  if (!normalizedInputId) return []
  return snippets.filter((snippet) => String(snippet.inputId || '').trim() === normalizedInputId)
}

export function useSessionScreen(props: SessionScreenProps) {
  const { id } = props
  const { data, createNote, updateNote, deleteNote, updateSession, updateSnippet, deleteSnippet } = useLocalAppData()
  const { showErrorToast, showToast } = useToast()
  const [isRegeneratingSnippets, setIsRegeneratingSnippets] = useState(false)

  const appData = data as any

  const session = useMemo<SessionDataItem | null>(() => {
    if (!Array.isArray(appData.sessions)) return null
    const rawSession = appData.sessions.find((item: any) => item.id === id)
    if (!rawSession) return null
    return {
      ...rawSession,
      inputId: String(rawSession.inputId || rawSession.id || '').trim() || undefined,
      clientId: String(rawSession.clientId || '').trim() || undefined,
      type: rawSession.type,
    }
  }, [appData.sessions, id])

  const resolvedInputId = session?.inputId || id

  const sessionNotes = useMemo<SessionNoteItem[]>(
    () =>
      (Array.isArray(appData.notes) ? appData.notes : [])
        .filter((note: SessionNoteItem) => note.sessionId === resolvedInputId)
        .sort((leftNote: SessionNoteItem, rightNote: SessionNoteItem) => leftNote.createdAtUnixMs - rightNote.createdAtUnixMs),
    [appData.notes, resolvedInputId],
  )

  const sessionSnippets = useMemo<SessionSnippetItem[]>(
    () => selectSnippetsForInput(Array.isArray(appData.snippets) ? appData.snippets : [], resolvedInputId),
    [appData.snippets, resolvedInputId],
  )

  const isSessionMissing = !session
  const summary = session?.summary || null
  const transcriptionStatus = session?.transcriptionStatus || 'idle'
  const transcript = session?.transcript || null
  const canRegenerateSnippets = sessionSnippets.length === 0 && Boolean(String(transcript || '').trim())

  async function handleRegenerateSessionSnippets() {
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

      updateSession(session.id, {})

      if (generatedSnippets.length === 0) {
        showToast('Geen snippets gevonden in deze sessie.')
      } else {
        showToast(`${generatedSnippets.length} snippet${generatedSnippets.length === 1 ? '' : 's'} gegenereerd.`)
      }
    } catch (error) {
      console.error('[SessionScreen] Snippet regeneration failed', error)
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
    isSessionMissing,
    summary,
    transcriptionStatus,
    transcript,
    canRegenerateSnippets,
    sessionNotes,
    sessionSnippets,
    isRegeneratingSnippets,
    handleRegenerateSessionSnippets,
    handleUpdateSnippetStatus,
    handleDeleteSnippet,
    createNote,
    updateNote,
    deleteNote,
  }
}

