import { createAudioBlobRemote } from '../../audio/audioBlobApi'
import { chargeRealtimeTranscription } from '../realtime/transcribeAudioRealtime'
import { isTranscriptionCancelledError, transcribeAudioBatch } from '../batch/transcribeAudioBatch'
import { generateStructuredInputSummary } from '../../summaries/generateInputSummaryFromTranscript'
import { extractSnippetsForItem } from '../../snippets/snippetGenerationApi'
import {
  finishTranscriptionRun,
  isTranscriptionRunActive,
  setSummaryAbortController,
  setTranscriptionAbortController,
  setTranscriptionOperationId,
  startTranscriptionRun,
} from '../transcriptionRunState'
import { normalizeTranscriptionError } from '../../../audio/processing/transcriptionError'
import {
  clearPendingPreviewAudioIfEligible,
  clearPendingPreviewAudio,
  markPendingPreviewTranscriptionSucceeded,
  markPendingPreviewAudioUploaded,
  setPendingPreviewProcessingState,
} from '../../../audio/pendingPreviewStore'
import { hasStructuredSummaryContent } from '../../../types/structuredSummary'
import type { Input } from '../../../storage/types'
import type { Snippet } from '../../../storage/types'

type InputUpdate = {
  audioBlobId?: string | null
  audioDurationSeconds?: number | null
  transcript?: string | null
  summary?: string | null
  summaryStructured?: Input['summaryStructured']
  transcriptionStatus?: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError?: string | null
}

type E2eeAudio = {
  encryptAudioBlobForStorage: (params: { audioBlob: Blob; mimeType: string }) => Promise<Blob>
  shouldStoreAudioAsOctetStream: boolean
}

const activeProcessingInputIds = new Set<string>()
const AUDIO_BLOB_SAVE_TIMEOUT_MS = 2 * 60 * 60_000

function normalizeWhitespace(value: string): string {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function removeSpeakerLabels(value: string): string {
  return String(value || '')
    .replace(/\bspeaker[_\s-]*\d+\b\s*:?\s*/gi, '')
    .replace(/\bspreker[_\s-]*\d+\b\s*:?\s*/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function sanitizeSnippetText(value: string): string {
  const withoutSpeakerLabels = removeSpeakerLabels(String(value || ''))
  return withoutSpeakerLabels
    .replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/g, '')
    .replace(/^\s*\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]\s*/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function looksLikeTranscript(value: string): boolean {
  const text = String(value || '').trim()
  if (!text) return false
  const speakerLabelMatches = text.match(/\b(?:speaker[_\s-]*\d+|spreker[_\s-]*\d+)\s*:/gi) || []
  if (speakerLabelMatches.length >= 1) return true
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length === 0) return false
  const transcriptLikeLines = lines.filter((line) => {
    if (/^\[\d{1,2}:\d{2}(?:\.\d+)?\]/.test(line)) return true
    if (/^\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]/.test(line)) return true
    if (/^(speaker[_\s-]*\d+|spreker\s*\d+|coach|client)\s*:/i.test(line)) return true
    return false
  }).length
  return transcriptLikeLines >= Math.max(2, Math.ceil(lines.length * 0.4))
}

function sanitizeCreatedSnippets(snippets: Snippet[]): Snippet[] {
  return snippets
    .map((snippet) => {
      const sanitizedText = sanitizeSnippetText(String(snippet.text || ''))
      if (!sanitizedText) return null
      return {
        ...snippet,
        text: sanitizedText,
      }
    })
    .filter((snippet): snippet is Snippet => Boolean(snippet))
}

function readTranscriptLeadSentence(transcript: string): string {
  const normalized = normalizeWhitespace(
    removeSpeakerLabels(String(transcript || ''))
      .replace(/^\s*\[\d{1,2}:\d{2}(?:\.\d+)?\]\s*/g, '')
      .replace(/^\s*\d{1,2}:\d{2}(?:\.\d+)?\s*[-:]\s*/g, ''),
  )
  if (!normalized) return ''
  const match = normalized.match(/^(.{40,280}?[.!?])(?:\s|$)/)
  return normalizeWhitespace(match?.[1] || normalized.slice(0, 220))
}

function buildFallbackStructuredSummary(transcript: string): NonNullable<Input['summaryStructured']> {
  const lead = readTranscriptLeadSentence(transcript)
  return {
    doelstelling: lead || 'Kernpunten besproken in deze sessie.',
    belastbaarheid: lead || '',
    belemmeringen: '',
    voortgang: lead || '',
    arbeidsmarktorientatie: '',
  }
}

function buildFallbackSnippet(params: { sessionId: string; trajectoryId: string | null | undefined; transcript: string; itemDate: number }): Snippet | null {
  const text = sanitizeSnippetText(readTranscriptLeadSentence(params.transcript))
  if (!text) return null
  const now = Date.now()
  return {
    id: `snippet-${crypto.randomUUID()}`,
    trajectoryId: params.trajectoryId ?? null,
    inputId: params.sessionId,
    itemId: params.sessionId,
    field: 'algemeen',
    text,
    date: Number.isFinite(params.itemDate) ? params.itemDate : now,
    status: 'pending',
    createdAtUnixMs: now,
    updatedAtUnixMs: now,
  }
}

function isMissingAudioBytesError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || '').toLowerCase()
  return message.includes('missing audio bytes') || message.includes('audio payload is empty')
}

function isNoSpeechDetectedError(error: unknown): boolean {
  const message = String(error instanceof Error ? error.message : error || '').toLowerCase()
  return message.includes('geen spraak gedetecteerd') || message.includes('no transcript returned')
}

async function maybeExtractSnippets(params: {
  enabled: boolean
  sessionId: string
  clientId?: string | null
  trajectoryId?: string | null
  transcript: string
  itemDate: number
  onCreatedSnippets?: (snippets: Snippet[]) => void
}) {
  if (!params.enabled) return
  const transcript = String(params.transcript || '').trim()
  if (!transcript) return
  const clientId = String(params.clientId || '').trim()

  try {
    const snippets = await extractSnippetsForItem({
      itemId: params.sessionId,
      clientId: clientId || undefined,
      trajectoryId: params.trajectoryId ?? null,
      sourceInputType: 'recording',
      transcript,
      itemDate: params.itemDate,
    })
    const sanitizedSnippets = sanitizeCreatedSnippets(snippets)
    if (sanitizedSnippets.length > 0) {
      params.onCreatedSnippets?.(sanitizedSnippets)
    }
  } catch (error) {
    console.warn('[processRecordedInput] snippet extraction failed', error)
    const fallback = buildFallbackSnippet({
      sessionId: params.sessionId,
      trajectoryId: params.trajectoryId,
      transcript,
      itemDate: params.itemDate,
    })
    if (fallback) {
      params.onCreatedSnippets?.([fallback])
    }
  }
}

export async function processRecordedInput(params: {
  sessionId: string
  audioBlob: Blob
  mimeType: string
  shouldSaveAudio?: boolean
  transcriptOverride?: string | null
  realtimeCharge?: {
    operationId: string
    durationSeconds: number
  } | null
  summaryTemplate?: {
    name: string
    sections: { title: string; description: string }[]
  }
  initialAudioBlobId: string | null
  e2ee: E2eeAudio
  updateInput: (sessionId: string, values: InputUpdate) => void
  snippetExtraction?: {
    enabled: boolean
    clientId: string | null
    trajectoryId: string | null
    itemDate: number
    onCreatedSnippets?: (snippets: Snippet[]) => void
  }
}): Promise<void> {
  const {
    sessionId,
    audioBlob,
    mimeType,
    shouldSaveAudio = true,
    transcriptOverride,
    realtimeCharge,
    summaryTemplate,
    initialAudioBlobId,
    e2ee,
    updateInput,
    snippetExtraction,
  } = params

  if (activeProcessingInputIds.has(sessionId)) {
    return
  }
  activeProcessingInputIds.add(sessionId)

  const runId = startTranscriptionRun(sessionId)
  const allowAudioSave = shouldSaveAudio

  let ensuredAudioBlobId = initialAudioBlobId
  let hasTranscriptResult = false
  let latestTranscriptForSnippetExtraction: string | null = null
  try {
    if (allowAudioSave && !ensuredAudioBlobId) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'encrypting', errorMessage: null })
      const encryptedBlob = await e2ee.encryptAudioBlobForStorage({ audioBlob, mimeType })

      await setPendingPreviewProcessingState({ sessionId, processingState: 'uploading', errorMessage: null })
      const storageMimeType = e2ee.shouldStoreAudioAsOctetStream ? 'application/octet-stream' : mimeType
      try {
        const createdAudio = await createAudioBlobRemote({
          audioBlob: encryptedBlob,
          mimeType: storageMimeType,
          timeoutMs: AUDIO_BLOB_SAVE_TIMEOUT_MS,
        })
        const nextId = String(createdAudio.audioBlobId || '').trim()
        if (!nextId) {
          throw new Error('Geen audio id teruggekregen van de server.')
        }
        ensuredAudioBlobId = nextId
        updateInput(sessionId, { audioBlobId: ensuredAudioBlobId })
        await markPendingPreviewAudioUploaded({ sessionId, audioBlobId: ensuredAudioBlobId })
        await clearPendingPreviewAudioIfEligible(sessionId)
      } catch (error) {
        if (!isMissingAudioBytesError(error)) throw error
        console.warn('[processRecordedInput] Audio save failed, continuing without persisted audio', {
          sessionId,
          error: error instanceof Error ? error.message : String(error || ''),
        })
      }
    } else if (allowAudioSave && ensuredAudioBlobId) {
      await markPendingPreviewAudioUploaded({ sessionId, audioBlobId: ensuredAudioBlobId })
      await clearPendingPreviewAudioIfEligible(sessionId)
    }

    updateInput(sessionId, {
      transcriptionStatus: 'transcribing',
      transcriptionError: null,
    })

    const presetTranscript = String(transcriptOverride || '').trim()
    if (presetTranscript) {
      latestTranscriptForSnippetExtraction = presetTranscript
      if (realtimeCharge?.operationId && Number.isFinite(realtimeCharge.durationSeconds) && realtimeCharge.durationSeconds > 0) {
        await chargeRealtimeTranscription({
          operationId: realtimeCharge.operationId,
          durationSeconds: realtimeCharge.durationSeconds,
        })
      }

      const summaryAbortController = new AbortController()
      setSummaryAbortController(sessionId, runId, summaryAbortController)
      updateInput(sessionId, {
        transcript: presetTranscript,
        transcriptionStatus: 'generating',
        transcriptionError: null,
      })
      hasTranscriptResult = true
      const generatedStructuredSummary = await generateStructuredInputSummary({
        transcript: presetTranscript,
        signal: summaryAbortController.signal,
      })
      if (!isTranscriptionRunActive(sessionId, runId)) return
      const resolvedStructuredSummary = hasStructuredSummaryContent(generatedStructuredSummary)
        ? generatedStructuredSummary
        : buildFallbackStructuredSummary(presetTranscript)
      await maybeExtractSnippets({
        enabled: Boolean(snippetExtraction?.enabled),
        sessionId,
        clientId: snippetExtraction?.clientId ?? null,
        trajectoryId: snippetExtraction?.trajectoryId ?? null,
        transcript: presetTranscript,
        itemDate: Number(snippetExtraction?.itemDate) || Date.now(),
        onCreatedSnippets: snippetExtraction?.onCreatedSnippets,
      })
      updateInput(sessionId, {
        summaryStructured: resolvedStructuredSummary,
        summary: null,
        audioBlobId: null,
        audioDurationSeconds: null,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      await markPendingPreviewTranscriptionSucceeded(sessionId)
      await clearPendingPreviewAudioIfEligible(sessionId)
      finishTranscriptionRun(sessionId, runId)
      return
    }

    const transcriptionAbortController = new AbortController()
    setTranscriptionAbortController(sessionId, runId, transcriptionAbortController)
    const { transcript, summary } = await transcribeAudioBatch({
      audioBlob,
      mimeType,
      languageCode: 'nl',
      signal: transcriptionAbortController.signal,
      progress: {
        onOperationPrepared: (operationId) => {
          if (!isTranscriptionRunActive(sessionId, runId)) return
          setTranscriptionOperationId(sessionId, runId, operationId)
        },
      },
    })
    if (!isTranscriptionRunActive(sessionId, runId)) return
    setTranscriptionAbortController(sessionId, runId, null)
    latestTranscriptForSnippetExtraction = transcript

    const cleanedSummary = String(summary || '').trim()
    if (cleanedSummary && !looksLikeTranscript(cleanedSummary)) {
      updateInput(sessionId, {
        transcript,
        summary: cleanedSummary,
        transcriptionStatus: 'generating',
        transcriptionError: null,
      })
      await maybeExtractSnippets({
        enabled: Boolean(snippetExtraction?.enabled),
        sessionId,
        clientId: snippetExtraction?.clientId ?? null,
        trajectoryId: snippetExtraction?.trajectoryId ?? null,
        transcript,
        itemDate: Number(snippetExtraction?.itemDate) || Date.now(),
        onCreatedSnippets: snippetExtraction?.onCreatedSnippets,
      })
      updateInput(sessionId, {
        audioBlobId: null,
        audioDurationSeconds: null,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      await markPendingPreviewTranscriptionSucceeded(sessionId)
      await clearPendingPreviewAudioIfEligible(sessionId)
      finishTranscriptionRun(sessionId, runId)
      return
    }

    const summaryAbortController = new AbortController()
    setSummaryAbortController(sessionId, runId, summaryAbortController)
    updateInput(sessionId, {
      transcript,
      transcriptionStatus: 'generating',
      transcriptionError: null,
    })
    hasTranscriptResult = true
    const generatedStructuredSummary = await generateStructuredInputSummary({
      transcript,
      signal: summaryAbortController.signal,
    })
    if (!isTranscriptionRunActive(sessionId, runId)) return
    const resolvedStructuredSummary = hasStructuredSummaryContent(generatedStructuredSummary)
      ? generatedStructuredSummary
      : buildFallbackStructuredSummary(transcript)
    await maybeExtractSnippets({
      enabled: Boolean(snippetExtraction?.enabled),
      sessionId,
      clientId: snippetExtraction?.clientId ?? null,
      trajectoryId: snippetExtraction?.trajectoryId ?? null,
      transcript,
      itemDate: Number(snippetExtraction?.itemDate) || Date.now(),
      onCreatedSnippets: snippetExtraction?.onCreatedSnippets,
    })
    updateInput(sessionId, {
      summaryStructured: resolvedStructuredSummary,
      summary: null,
      audioBlobId: null,
      audioDurationSeconds: null,
      transcriptionStatus: 'done',
      transcriptionError: null,
    })
    await markPendingPreviewTranscriptionSucceeded(sessionId)
    await clearPendingPreviewAudioIfEligible(sessionId)
    finishTranscriptionRun(sessionId, runId)
  } catch (error) {
    if (!isTranscriptionRunActive(sessionId, runId)) {
      return
    }

    const errorMessage = normalizeTranscriptionError(error)
    if (isTranscriptionCancelledError(error)) {
      finishTranscriptionRun(sessionId, runId)
      return
    }

    if (hasTranscriptResult) {
      const fallbackSummary = latestTranscriptForSnippetExtraction
        ? buildFallbackStructuredSummary(latestTranscriptForSnippetExtraction)
        : null
      if (latestTranscriptForSnippetExtraction) {
        await maybeExtractSnippets({
          enabled: Boolean(snippetExtraction?.enabled),
          sessionId,
          clientId: snippetExtraction?.clientId ?? null,
          trajectoryId: snippetExtraction?.trajectoryId ?? null,
          transcript: latestTranscriptForSnippetExtraction,
          itemDate: Number(snippetExtraction?.itemDate) || Date.now(),
          onCreatedSnippets: snippetExtraction?.onCreatedSnippets,
        })
      }
      updateInput(sessionId, {
        ...(fallbackSummary ? { summaryStructured: fallbackSummary, summary: null } : null),
        transcriptionStatus: 'done',
        transcriptionError: errorMessage,
      })
      try {
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
      } catch (pendingStateError) {
        console.warn('[processRecordedInput] failed to update pending preview state after summary error', pendingStateError)
      }
      if (!allowAudioSave) {
        await clearPendingPreviewAudio(sessionId)
      }
      finishTranscriptionRun(sessionId, runId)
      return
    }

    if (allowAudioSave && !ensuredAudioBlobId) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'failed', errorMessage })
    }
    if (!allowAudioSave) {
      await setPendingPreviewProcessingState({ sessionId, processingState: 'failed', errorMessage })
      await clearPendingPreviewAudio(sessionId)
    }

    if (isNoSpeechDetectedError(error)) {
      updateInput(sessionId, {
        transcript: '',
        summary: 'Er is geen spraak gedetecteerd in deze opname.',
        summaryStructured: null,
        transcriptionStatus: 'done',
        transcriptionError: null,
      })
      try {
        await markPendingPreviewTranscriptionSucceeded(sessionId)
        await clearPendingPreviewAudioIfEligible(sessionId)
      } catch (pendingStateError) {
        console.warn('[processRecordedInput] failed to update pending preview state after no-speech completion', pendingStateError)
      }
      finishTranscriptionRun(sessionId, runId)
      return
    }

    updateInput(sessionId, {
      transcriptionStatus: 'error',
      transcriptionError: errorMessage,
    })
    finishTranscriptionRun(sessionId, runId)
    throw error
  } finally {
    activeProcessingInputIds.delete(sessionId)
  }
}

