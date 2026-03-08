import { useEffect, useState } from 'react'

import type { ActivityTemplate, Snippet } from '../../storage/types'
import { detectActivitiesFromTranscript, type DetectedActivitySuggestion, aiEditSnippetText, aiOverwriteSnippetText, extractSnippetsForItem } from '../../api/activities'

export type ActivitySuggestionDecision = 'pending' | 'approved' | 'rejected'
export type PendingActivitySuggestion = DetectedActivitySuggestion & {
  id: string
  editedHours: string
  decision: ActivitySuggestionDecision
}

type SnippetDraft = {
  id: string
  text: string
}

type SnippetActionState = 'editing' | 'overwriting' | undefined

type Params = {
  activityTemplates: ActivityTemplate[]
  activeTrajectoryId: string | null
  createActivity: (params: {
    trajectoryId: string
    sessionId: string
    templateId: string | null
    name: string
    category: string
    status: 'executed'
    actualHours: number
    source: 'ai_detected'
    isAdmin: boolean
  }) => string | null
  createSnippet: (params: {
    trajectoryId: string
    itemId: string
    field: string
    text: string
    date: number
    status: 'pending' | 'approved' | 'rejected'
  }) => string | null
  e2eeEnabled: boolean
  itemCreatedAtUnixMs: number
  sessionId: string
  showErrorToast: (message: string, description?: string) => void
  showToast: (message: string, description?: string) => void
  snippetsForSession: Snippet[]
  transcript: string | null
  updateSession: (sessionId: string, patch: Record<string, unknown>) => void
  updateSnippet: (snippetId: string, patch: { text?: string; status?: 'pending' | 'approved' | 'rejected' }) => void
}

function normalizeHoursInput(value: string): string {
  const trimmed = String(value || '').replace(',', '.').trim()
  if (!trimmed) return ''
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed)) return ''
  return String(Math.max(0, parsed))
}

export function useSessieDetailActivitySnippetFlow({
  activityTemplates,
  activeTrajectoryId,
  createActivity,
  createSnippet,
  e2eeEnabled,
  itemCreatedAtUnixMs,
  sessionId,
  showErrorToast,
  showToast,
  snippetsForSession,
  transcript,
  updateSession,
  updateSnippet,
}: Params) {
  const [isDetectingActivities, setIsDetectingActivities] = useState(false)
  const [detectedActivitySuggestions, setDetectedActivitySuggestions] = useState<PendingActivitySuggestion[]>([])
  const [snippetDraftsById, setSnippetDraftsById] = useState<Record<string, SnippetDraft>>({})
  const [isGeneratingSnippets, setIsGeneratingSnippets] = useState(false)
  const [snippetActionById, setSnippetActionById] = useState<Record<string, SnippetActionState>>({})

  useEffect(() => {
    setSnippetDraftsById((previous) => {
      const next: Record<string, SnippetDraft> = {}
      for (const snippet of snippetsForSession) {
        next[snippet.id] = previous[snippet.id] ?? { id: snippet.id, text: snippet.text }
      }
      return next
    })
  }, [snippetsForSession])

  async function handleDetectActivities() {
    if (isDetectingActivities) return
    const transcriptValue = String(transcript || '').trim()
    if (!transcriptValue) {
      showErrorToast('Geen transcript beschikbaar om activiteiten te detecteren.')
      return
    }
    const trajectoryId = String(activeTrajectoryId || '').trim()
    if (!trajectoryId) {
      showErrorToast('Koppel dit item eerst aan een trajectory om activiteiten te detecteren.')
      return
    }
    setIsDetectingActivities(true)
    try {
      const suggestions = await detectActivitiesFromTranscript({
        itemId: sessionId,
        trajectoryId,
        transcript: transcriptValue,
      })
      const nextSuggestions: PendingActivitySuggestion[] = suggestions.map((suggestion, index) => ({
        ...suggestion,
        id: `${sessionId}-${Date.now()}-${index + 1}`,
        editedHours: String(suggestion.suggestedHours),
        decision: 'pending',
      }))
      setDetectedActivitySuggestions(nextSuggestions)
      if (nextSuggestions.length === 0) {
        showToast('Geen activiteiten gedetecteerd.')
      }
    } catch (error) {
      console.error('[SessieDetailScreen] Activity detect failed', error)
      showErrorToast('Activiteiten detecteren is mislukt. Probeer opnieuw.')
    } finally {
      setIsDetectingActivities(false)
    }
  }

  function handleChangeDetectedHours(suggestionId: string, nextValue: string) {
    setDetectedActivitySuggestions((previous) =>
      previous.map((suggestion) =>
        suggestion.id === suggestionId
          ? {
              ...suggestion,
              editedHours: nextValue.replace(',', '.'),
            }
          : suggestion,
      ),
    )
  }

  function handleApproveDetectedActivity(suggestionId: string) {
    const suggestion = detectedActivitySuggestions.find((item) => item.id === suggestionId)
    if (!suggestion || suggestion.decision !== 'pending') return
    const trajectoryId = String(activeTrajectoryId || '').trim()
    if (!trajectoryId) {
      showErrorToast('Geen trajectory geselecteerd voor dit item.')
      return
    }
    const parsedHours = Number(normalizeHoursInput(suggestion.editedHours))
    const actualHours = Number.isFinite(parsedHours) && parsedHours > 0 ? parsedHours : suggestion.suggestedHours
    const matchedTemplate = suggestion.templateId ? activityTemplates.find((template) => template.id === suggestion.templateId) ?? null : null
    createActivity({
      trajectoryId,
      sessionId,
      templateId: matchedTemplate?.id ?? null,
      name: suggestion.name,
      category: suggestion.category,
      status: 'executed',
      actualHours,
      source: 'ai_detected',
      isAdmin: matchedTemplate?.isAdmin === true,
    })
    setDetectedActivitySuggestions((previous) =>
      previous.map((item) => (item.id === suggestionId ? { ...item, decision: 'approved', editedHours: String(actualHours) } : item)),
    )
  }

  function handleRejectDetectedActivity(suggestionId: string) {
    setDetectedActivitySuggestions((previous) =>
      previous.map((item) => (item.id === suggestionId ? { ...item, decision: 'rejected' } : item)),
    )
  }

  function getSnippetDraftText(snippet: Snippet): string {
    return snippetDraftsById[snippet.id]?.text ?? snippet.text
  }

  function handleChangeSnippetText(snippetId: string, text: string) {
    setSnippetDraftsById((previous) => ({
      ...previous,
      [snippetId]: { id: snippetId, text },
    }))
  }

  function handleSaveSnippetText(snippet: Snippet) {
    const text = String(getSnippetDraftText(snippet) || '').trim()
    if (!text || text === snippet.text) return
    updateSnippet(snippet.id, { text })
  }

  async function handleGenerateSnippets() {
    if (isGeneratingSnippets) return
    const transcriptValue = String(transcript || '').trim()
    if (!transcriptValue) {
      showErrorToast('Geen transcript beschikbaar om snippets te genereren.')
      return
    }
    const trajectoryId = String(activeTrajectoryId || '').trim()
    if (!trajectoryId) {
      showErrorToast('Koppel dit item eerst aan een trajectory om snippets te genereren.')
      return
    }
    setIsGeneratingSnippets(true)
    try {
      const generatedSnippets = await extractSnippetsForItem({
        itemId: sessionId,
        trajectoryId,
        transcript: transcriptValue,
        itemDate: itemCreatedAtUnixMs,
      })
      if (e2eeEnabled) {
        // Trigger a provider refresh so server-created snippets are loaded into local state.
        updateSession(sessionId, {})
      } else {
        for (const snippet of generatedSnippets) {
          createSnippet({
            trajectoryId: snippet.trajectoryId,
            itemId: snippet.itemId,
            field: snippet.field,
            text: snippet.text,
            date: snippet.date,
            status: snippet.status,
          })
        }
      }
      if (generatedSnippets.length === 0) {
        showToast('Geen snippets gevonden in dit transcript.')
      } else {
        showToast(`${generatedSnippets.length} snippet${generatedSnippets.length === 1 ? '' : 's'} toegevoegd.`)
      }
    } catch (error) {
      console.error('[SessieDetailScreen] Snippet extract failed', error)
      showErrorToast('Snippets genereren is mislukt. Probeer opnieuw.')
    } finally {
      setIsGeneratingSnippets(false)
    }
  }

  async function handleAiEditSnippet(snippet: Snippet) {
    const transcriptValue = String(transcript || '').trim()
    if (!transcriptValue) {
      showErrorToast('Geen transcript beschikbaar voor AI bewerken.')
      return
    }
    setSnippetActionById((previous) => ({ ...previous, [snippet.id]: 'editing' }))
    try {
      const text = await aiEditSnippetText({
        field: snippet.field,
        snippetText: String(getSnippetDraftText(snippet) || '').trim() || snippet.text,
        transcript: transcriptValue,
      })
      if (!text) {
        showErrorToast('AI kon geen snippettekst voorstellen.')
        return
      }
      setSnippetDraftsById((previous) => ({
        ...previous,
        [snippet.id]: { id: snippet.id, text },
      }))
      updateSnippet(snippet.id, { text })
    } catch (error) {
      console.error('[SessieDetailScreen] Snippet AI edit failed', error)
      showErrorToast('AI bewerken is mislukt. Probeer opnieuw.')
    } finally {
      setSnippetActionById((previous) => ({ ...previous, [snippet.id]: undefined }))
    }
  }

  async function handleAiOverwriteSnippet(snippet: Snippet) {
    const transcriptValue = String(transcript || '').trim()
    if (!transcriptValue) {
      showErrorToast('Geen transcript beschikbaar voor AI overschrijven.')
      return
    }
    setSnippetActionById((previous) => ({ ...previous, [snippet.id]: 'overwriting' }))
    try {
      const text = await aiOverwriteSnippetText({ field: snippet.field, transcript: transcriptValue })
      if (!text) {
        showErrorToast('AI kon geen nieuwe snippet voorstellen.')
        return
      }
      setSnippetDraftsById((previous) => ({
        ...previous,
        [snippet.id]: { id: snippet.id, text },
      }))
      updateSnippet(snippet.id, { text, status: 'pending' })
    } catch (error) {
      console.error('[SessieDetailScreen] Snippet AI overwrite failed', error)
      showErrorToast('AI overschrijven is mislukt. Probeer opnieuw.')
    } finally {
      setSnippetActionById((previous) => ({ ...previous, [snippet.id]: undefined }))
    }
  }

  return {
    detectedActivitySuggestions,
    getSnippetDraftText,
    handleAiEditSnippet,
    handleAiOverwriteSnippet,
    handleApproveDetectedActivity,
    handleChangeDetectedHours,
    handleChangeSnippetText,
    handleDetectActivities,
    handleGenerateSnippets,
    handleRejectDetectedActivity,
    handleSaveSnippetText,
    isDetectingActivities,
    isGeneratingSnippets,
    setDetectedActivitySuggestions,
    snippetActionById,
  }
}

