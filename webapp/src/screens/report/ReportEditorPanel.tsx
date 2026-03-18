import React, { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ChevronDownIcon } from '@/icons/ChevronDownIcon'
import { CircleCloseIcon } from '@/icons/CircleCloseIcon'
import { PauseIcon } from '@/icons/PauseIcon'
import { PlaySmallIcon } from '@/icons/PlaySmallIcon'
import { ArrowUpIcon } from '@/icons/ArrowUpIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { ReportUwvLogoIcon } from '@/icons/ReportScreenIcons'
import { StopSquareIcon } from '@/icons/StopSquareIcon'
import { StarsIcon } from '@/icons/StarsIcon'
import { readPipelineReport, saveReportFieldEdit, streamReportPipelineChatMessage, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { exportReportToWord } from '@/api/reports/exportReportToWord'
import { fetchRealtimeTranscriptionRuntime, startRealtimeTranscription, type RealtimeTranscriberInput } from '@/api/transcription/realtime/transcribeAudioRealtime'
import { useLiveAudioWaveformBars } from '@/audio/recording/useLiveAudioWaveformBars'
import {
  asObject,
  capitalizeFirstLetter,
  composeNameField,
  deserializeAddressSplit,
  decomposeNameField,
  formatInitialsForEditing,
  normalizeHoursInput,
  normalizeNumericInput,
  parseHoursToNumber,
  readConditionalHiddenFieldIds,
  readDefaultSectionTitle,
  readDisplayFieldLabel,
  readFieldVariant,
  readNumberFromLabel,
  readSingleChoiceOptions,
  readSingleChoiceValueKey,
  REINTEGRATIE_ACTIVITEITEN_OPTIES,
  serializeAddressSplit,
  shouldShowAkkoordToelichting,
  stripNumberPrefix,
} from '@/screens/report/reportEditorFieldUi'
import { hasChatFieldUpdates, readFieldOrder } from '@/screens/report/reportEditorLogic'
import { buildStructuredExportContext, buildStructuredReportText } from '@/screens/report/structuredReportExport'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ChatMessage } from '@/screens/shared/components/chat/ChatMessage'
import { createTypewriterStream } from '@/screens/shared/components/chat/createTypewriterStream'
import { ConfirmChatClearModal } from '@/screens/shared/modals/ConfirmChatClearModal'
import { readJsonFromLocalStorage, writeJsonToLocalStorage } from '@/storage/localStorageJson'
import type { JsonValue, Report, ReportFieldType } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

type Props = {
  report: Report
  templates: PipelineTemplate[]
  onReportUpdated: (report: Report) => void
  showExportButton?: boolean
  onSavingStateChange?: (isSaving: boolean) => void
}
type ChatRow = { id: string; role: 'user' | 'assistant'; text: string }
type RenderField = { key: string; sourceFieldId: string; numberKey: string; label: string; fieldType: ReportFieldType; variant: ReturnType<typeof readFieldVariant> }
type RenderSection = { key: string; title: string; fields: RenderField[]; status: 'complete' | 'incomplete' }

const webNoOutlineInputStyle = { outlineStyle: 'none', outlineWidth: 0, resize: 'none', overflow: 'hidden' } as any
const ONE_LINE_HEIGHT = 40
const FIVE_LINE_HEIGHT = 110
const HOUR_INPUT_SIZE = 72
const ROW_ACTION_SIZE = ONE_LINE_HEIGHT
const INPUT_LINE_HEIGHT = 20
const INPUT_VERTICAL_PADDING = 16
const REPORT_SECTION_COLLAPSE_STORAGE_KEY = 'coachscribe.reportSectionCollapse.v1'

function readStoredCollapseState(reportId: string): Record<string, boolean> {
  const stored = readJsonFromLocalStorage<Record<string, Record<string, boolean>>>(REPORT_SECTION_COLLAPSE_STORAGE_KEY)
  if (!stored.ok || !stored.value || typeof stored.value !== 'object') return {}
  const byReport = stored.value[String(reportId || '')]
  if (!byReport || typeof byReport !== 'object') return {}
  const normalized: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(byReport)) normalized[key] = Boolean(value)
  return normalized
}

function escapeRegExp(value: string): string {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function answerToText(answer: JsonValue): string {
  if (typeof answer === 'string') return answer
  if (answer === null || typeof answer === 'undefined') return ''
  return JSON.stringify(answer)
}

function readJsonChoice(answer: JsonValue, key: string): number | null {
  const obj = asObject(answer)
  return typeof obj?.[key] === 'number' ? (obj?.[key] as number) : null
}

function isAnswerFilled(answer: JsonValue): boolean {
  if (typeof answer === 'string') return answer.trim().length > 0
  if (typeof answer === 'number' || typeof answer === 'boolean') return true
  if (!answer) return false
  if (Array.isArray(answer)) return answer.length > 0
  return Object.keys(answer).length > 0
}

function parseFieldUpdateAnswer(answer: unknown): JsonValue {
  if (typeof answer !== 'string') return (answer as JsonValue) ?? ''
  const trimmed = answer.trim()
  if (!trimmed) return ''
  const appearsJsonObject = trimmed.startsWith('{') && trimmed.endsWith('}')
  const appearsJsonArray = trimmed.startsWith('[') && trimmed.endsWith(']')
  if (!appearsJsonObject && !appearsJsonArray) return answer
  try {
    return JSON.parse(trimmed) as JsonValue
  } catch {
    return answer
  }
}

function applyFieldUpdatesToReport(baseReport: Report, fieldUpdates: Array<{ fieldId: string; answer: unknown }>): Report {
  if (!baseReport.reportStructuredJson) return baseReport
  if (!Array.isArray(fieldUpdates) || fieldUpdates.length === 0) return baseReport
  const nextFields = { ...baseReport.reportStructuredJson.fields }
  let hasChanges = false
  for (const update of fieldUpdates) {
    const fieldId = String(update?.fieldId || '').trim()
    if (!fieldId) continue
    const sourceField = nextFields[fieldId]
    if (!sourceField) continue
    const nextAnswer = parseFieldUpdateAnswer(update.answer)
    if (JSON.stringify(sourceField.answer ?? '') === JSON.stringify(nextAnswer ?? '')) continue
    hasChanges = true
    nextFields[fieldId] = {
      ...sourceField,
      answer: nextAnswer,
      updatedAtUnixMs: Date.now(),
    }
  }
  if (!hasChanges) return baseReport
  return {
    ...baseReport,
    updatedAtUnixMs: Date.now(),
    reportStructuredJson: {
      ...baseReport.reportStructuredJson,
      updatedAtUnixMs: Date.now(),
      fields: nextFields,
    },
  }
}

function reportContainsFieldUpdates(report: Report | null | undefined, fieldUpdates: Array<{ fieldId: string; answer: unknown }>): boolean {
  const fields = report?.reportStructuredJson?.fields
  if (!fields) return false
  for (const update of fieldUpdates) {
    const fieldId = String(update?.fieldId || '').trim()
    if (!fieldId) continue
    const existingField = fields[fieldId]
    if (!existingField) return false
    const expectedAnswer = parseFieldUpdateAnswer(update.answer)
    if (JSON.stringify(existingField.answer ?? '') !== JSON.stringify(expectedAnswer ?? '')) return false
  }
  return true
}

export function ReportEditorPanel({ report, templates, onReportUpdated, showExportButton = true, onSavingStateChange }: Props) {
  const { showErrorToast, showToast } = useToast()
  const [draftByFieldId, setDraftByFieldId] = useState<Record<string, JsonValue>>({})
  const [collapsedBySectionKey, setCollapsedBySectionKey] = useState<Record<string, boolean>>(() => readStoredCollapseState(report.id))
  const [pendingSaveCount, setPendingSaveCount] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatRows, setChatRows] = useState<ChatRow[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [activeAssistantStreamId, setActiveAssistantStreamId] = useState<string | null>(null)
  const [isTranscriptionBusy, setIsTranscriptionBusy] = useState(false)
  const [isTranscriptionStopping, setIsTranscriptionStopping] = useState(false)
  const [transcriptionMode, setTranscriptionMode] = useState<'idle' | 'recording' | 'paused'>('idle')
  const [transcriptionMediaStream, setTranscriptionMediaStream] = useState<MediaStream | null>(null)
  const [transcriptionWaveBarCount] = useState(24)
  const transcriptionSessionRef = useRef<RealtimeTranscriberInput | null>(null)
  const transcriptionStartMessageRef = useRef<string>('')
  const transcriptionBufferedTextRef = useRef<string>('')
  const isTranscriptionActive = transcriptionMode === 'recording' || transcriptionMode === 'paused'
  const [waveHistory, setWaveHistory] = useState<number[]>(() => Array.from({ length: 22 }, () => 4))
  const [silentPhase, setSilentPhase] = useState(0)
  const [isClearChatModalVisible, setIsClearChatModalVisible] = useState(false)
  const [chatComposerFocusTrigger, setChatComposerFocusTrigger] = useState(0)
  const chatScrollRef = useRef<ScrollView | null>(null)
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([])
  const [scopeContentHeight, setScopeContentHeight] = useState(0)
  const scopeHeightAnimation = useRef(new Animated.Value(0)).current
  const scopeOpacityAnimation = useRef(new Animated.Value(0)).current
  const [repeatableRowsByFieldId, setRepeatableRowsByFieldId] = useState<Record<string, Array<{ id: string; hours: string; activity: string }>>>({})
  const liveWaveHeights = useLiveAudioWaveformBars({
    mediaStream: transcriptionMediaStream,
    barCount: transcriptionWaveBarCount,
    isActive: transcriptionMode === 'recording',
  })
  const smoothedWaveHeightsRef = useRef<number[]>([])
  const estimateHeightFromText = (text: string, minHeight = FIVE_LINE_HEIGHT) => {
    const maxHeight = minHeight <= ONE_LINE_HEIGHT ? 180 : 420
    const lineCount = Math.max(1, String(text || '').split('\n').length)
    const estimated = INPUT_VERTICAL_PADDING + lineCount * INPUT_LINE_HEIGHT
    return Math.min(maxHeight, Math.max(minHeight, estimated))
  }
  const makeActivityRow = (activity = '', hours = '') => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, activity, hours })
  const isWaveSilent = liveWaveHeights.every((height) => height <= 9)
  React.useEffect(() => {
    const barCount = 22
    if (!isTranscriptionActive) {
      const idle = Array.from({ length: barCount }, () => 4)
      smoothedWaveHeightsRef.current = idle
      setWaveHistory(idle)
      return
    }
    const timer = setInterval(() => {
      const average = liveWaveHeights.length > 0 ? liveWaveHeights.reduce((sum, value) => sum + value, 0) / liveWaveHeights.length : 0
      const target = average <= 9 ? 4 : Math.max(4, Math.min(16, average / 10.5))
      const previous = smoothedWaveHeightsRef.current[smoothedWaveHeightsRef.current.length - 1] ?? target
      const smoothed = average <= 9 ? target : previous * 0.62 + target * 0.38
      if (average <= 9) setSilentPhase((value) => (value + 1) % barCount)
      setWaveHistory((prev) => {
        const normalized = prev.length === barCount ? prev : Array.from({ length: barCount }, () => 4)
        const next = [...normalized.slice(1), smoothed]
        smoothedWaveHeightsRef.current = next
        return next
      })
    }, 65)
    return () => clearInterval(timer)
  }, [isTranscriptionActive, liveWaveHeights])

  const structured = report.reportStructuredJson
  const template = useMemo(() => templates.find((item) => item.id === structured?.templateId) ?? null, [structured?.templateId, templates])
  const orderedFieldIds = useMemo(() => readFieldOrder(report, template), [report, template])
  const getCurrentAnswer = (fieldId: string): JsonValue => draftByFieldId[fieldId] ?? structured?.fields[fieldId]?.answer ?? ''
  const fieldMetaById = useMemo(() => {
    const next: Record<string, { numberKey: string; label: string }> = {}
    if (!structured) return next
    for (const fieldId of orderedFieldIds) {
      const source = structured.fields[fieldId]
      if (!source) continue
      const numberKey = template?.fields.find((f) => f.fieldId === fieldId)?.exportNumberKey || readNumberFromLabel(source.label)
      const label = readDisplayFieldLabel(numberKey, stripNumberPrefix(source.label) || source.label || fieldId, template?.id || template?.name || '')
      next[fieldId] = { numberKey, label }
    }
    for (const [fieldId, source] of Object.entries(structured.fields)) {
      if (next[fieldId]) continue
      const numberKey = template?.fields.find((f) => f.fieldId === fieldId)?.exportNumberKey || readNumberFromLabel(source.label)
      const label = readDisplayFieldLabel(numberKey, stripNumberPrefix(source.label) || source.label || fieldId, template?.id || template?.name || '')
      next[fieldId] = { numberKey, label }
    }
    return next
  }, [orderedFieldIds, structured, template])
  const fieldIdByNumberKey = useMemo(() => {
    const next: Record<string, string> = {}
    for (const fieldId of orderedFieldIds) {
      const sourceField = structured?.fields[fieldId]
      const meta = fieldMetaById[fieldId]
      if (!sourceField || !meta?.numberKey) continue
      if (next[meta.numberKey]) continue
      next[meta.numberKey] = fieldId
    }
    return next
  }, [fieldMetaById, orderedFieldIds, structured?.fields])

  const rp81Choice = readJsonChoice(getCurrentAnswer('rp_werkfit_8_1'), 'keuze')
  const er42Choice = readJsonChoice(getCurrentAnswer('er_werkfit_4_2'), 'keuze')
  const hiddenFieldIds = useMemo(() => new Set(readConditionalHiddenFieldIds({ rp81Choice, er42Choice })), [rp81Choice, er42Choice])

  const sections = useMemo<RenderSection[]>(() => {
    if (!structured) return []
    const grouped = new Map<string, RenderField[]>()
    for (const fieldId of orderedFieldIds) {
      if (hiddenFieldIds.has(fieldId)) continue
      const source = structured.fields[fieldId]
      if (!source) continue
      const numberKey = template?.fields.find((f) => f.fieldId === fieldId)?.exportNumberKey || readNumberFromLabel(source.label)
      const sectionKey = (numberKey.split('.')[0] || '0').trim()
      if (sectionKey === '9') continue
      const label = readDisplayFieldLabel(numberKey, stripNumberPrefix(source.label) || source.label, template?.id || template?.name || '')
      const variant = readFieldVariant({ fieldId, numberKey, fieldType: source.fieldType })
      const entries: RenderField[] = [{ key: fieldId, sourceFieldId: fieldId, numberKey, label, fieldType: source.fieldType, variant }]
      if (!grouped.has(sectionKey)) grouped.set(sectionKey, [])
      grouped.get(sectionKey)?.push(...entries)
    }
    return Array.from(grouped.entries()).map(([key, fields]) => {
      const answered = fields.filter((field) => isAnswerFilled(structured.fields[field.sourceFieldId]?.answer ?? '')).length
      return {
        key,
        title: readDefaultSectionTitle(key, fields[0]?.label || '', template?.id || template?.name || ''),
        fields,
        status: answered === fields.length && fields.length > 0 ? 'complete' : 'incomplete',
      }
    })
  }, [structured, orderedFieldIds, template, hiddenFieldIds])

  React.useEffect(() => {
    setCollapsedBySectionKey(readStoredCollapseState(report.id))
  }, [report.id])

  React.useEffect(() => {
    const stored = readJsonFromLocalStorage<Record<string, Record<string, boolean>>>(REPORT_SECTION_COLLAPSE_STORAGE_KEY)
    const baseStore = stored.ok && stored.value && typeof stored.value === 'object' ? stored.value : {}
    writeJsonToLocalStorage(REPORT_SECTION_COLLAPSE_STORAGE_KEY, { ...baseStore, [report.id]: collapsedBySectionKey })
  }, [collapsedBySectionKey, report.id])

  React.useEffect(() => {
    if (!sections.length) return
    setCollapsedBySectionKey((prev) => {
      const next = { ...prev }
      for (const section of sections) if (!(section.key in next)) next[section.key] = section.status === 'complete'
      return next
    })
  }, [sections])

  React.useEffect(() => {
    setSelectedFieldIds([])
    setRepeatableRowsByFieldId({})
    transcriptionBufferedTextRef.current = ''
    void transcriptionSessionRef.current?.stop().catch(() => undefined)
    transcriptionSessionRef.current = null
    if (transcriptionMediaStream) {
      transcriptionMediaStream.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch {}
      })
      setTranscriptionMediaStream(null)
    }
    setTranscriptionMode('idle')
  }, [report.id])

  React.useEffect(() => {
    return () => {
      void transcriptionSessionRef.current?.stop().catch(() => undefined)
      if (transcriptionMediaStream) {
        transcriptionMediaStream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {}
        })
      }
    }
  }, [transcriptionMediaStream])

  React.useEffect(() => {
    if (!structured) return
    const timers: ReturnType<typeof setTimeout>[] = []
    const unchangedFieldIds: string[] = []
    for (const [fieldId, nextValue] of Object.entries(draftByFieldId)) {
      const current = structured.fields[fieldId]?.answer
      if (JSON.stringify(current ?? '') === JSON.stringify(nextValue ?? '')) {
        unchangedFieldIds.push(fieldId)
        continue
      }
      timers.push(setTimeout(() => { void handleSaveField(fieldId, nextValue) }, 700))
    }
    if (unchangedFieldIds.length > 0) {
      setDraftByFieldId((prev) => {
        let didChange = false
        const next = { ...prev }
        for (const fieldId of unchangedFieldIds) {
          if (!(fieldId in next)) continue
          delete next[fieldId]
          didChange = true
        }
        return didChange ? next : prev
      })
    }
    return () => timers.forEach(clearTimeout)
  }, [draftByFieldId, structured])

  const hasDirtyDraftValues = useMemo(() => {
    if (!structured) return false
    for (const [fieldId, nextValue] of Object.entries(draftByFieldId)) {
      const current = structured.fields[fieldId]?.answer
      if (JSON.stringify(current ?? '') !== JSON.stringify(nextValue ?? '')) return true
    }
    return false
  }, [draftByFieldId, structured])

  const isSaving = pendingSaveCount > 0 || hasDirtyDraftValues
  React.useEffect(() => {
    onSavingStateChange?.(isSaving)
  }, [isSaving, onSavingStateChange])

  React.useEffect(() => {
    const scrollView = chatScrollRef.current
    if (!scrollView) return
    const id = setTimeout(() => scrollView.scrollToEnd({ animated: true }), 0)
    return () => clearTimeout(id)
  }, [chatRows.length, isChatSending])

  React.useEffect(() => {
    const shouldShowScope = selectedFieldIds.length > 0
    const nextHeight = shouldShowScope ? scopeContentHeight : 0
    Animated.parallel([
      Animated.timing(scopeHeightAnimation, {
        toValue: nextHeight,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(scopeOpacityAnimation, {
        toValue: shouldShowScope ? 1 : 0,
        duration: shouldShowScope ? 180 : 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start()
  }, [scopeContentHeight, scopeHeightAnimation, scopeOpacityAnimation, selectedFieldIds.length])

  function handleChatComposerChange(nextValue: string) {
    let cleaned = String(nextValue || '')
    const matchedTags = Array.from(cleaned.matchAll(/(^|\s)@(\d+(?:\.\d+){0,2})(?=\s)/g))
    if (matchedTags.length === 0) {
      setChatMessage(nextValue)
      return
    }
    const taggedFieldIds: string[] = []
    for (const match of matchedTags) {
      const numberKey = String(match[2] || '').trim()
      if (!numberKey) continue
      const fieldId = fieldIdByNumberKey[numberKey]
      if (!fieldId) continue
      taggedFieldIds.push(fieldId)
      const mentionPattern = new RegExp(`(^|\\s)@${escapeRegExp(numberKey)}(?=\\s)`, 'g')
      cleaned = cleaned.replace(mentionPattern, '$1')
    }
    if (taggedFieldIds.length > 0) {
      setSelectedFieldIds((prev) => {
        const merged = new Set(prev)
        for (const fieldId of taggedFieldIds) merged.add(fieldId)
        return Array.from(merged)
      })
      setChatComposerFocusTrigger((value) => value + 1)
    }
    setChatMessage(cleaned.replace(/[ \t]{2,}/g, ' '))
  }

  async function handleSaveField(fieldId: string, answer: JsonValue) {
    setPendingSaveCount((value) => value + 1)
    try {
      const response = await saveReportFieldEdit({ reportId: report.id, fieldId, answer })
      onReportUpdated(response.report)
      setDraftByFieldId((prev) => {
        const next = { ...prev }; delete next[fieldId]; return next
      })
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Veld opslaan mislukt.')
    } finally {
      setPendingSaveCount((value) => Math.max(0, value - 1))
    }
  }

  function mergeTranscribedText(nextText: string) {
    const clean = String(nextText || '').trim()
    if (!clean) return
    const previous = transcriptionBufferedTextRef.current.trim()
    transcriptionBufferedTextRef.current = previous ? `${previous} ${clean}`.replace(/\s+/g, ' ').trim() : clean
  }

  async function startChatTranscription() {
    if (isTranscriptionBusy || isChatSending || transcriptionMode === 'recording') return
    setTranscriptionMode('recording')
    setWaveHistory(Array.from({ length: 22 }, () => 4))
    setIsTranscriptionBusy(true)
    let stream: MediaStream | null = null
    let usedExistingStream = true
    try {
      const runtime = await fetchRealtimeTranscriptionRuntime()
      if (runtime.mode !== 'azure-realtime-live') {
        throw new Error('Realtime transcriptie staat uit. Zet transcriptiemodus op realtime en probeer opnieuw.')
      }
      if (!runtime.providerConfigured) {
        throw new Error('Realtime transcriptie is nog niet geconfigureerd voor deze organisatie.')
      }
      if (!navigator?.mediaDevices?.getUserMedia && !transcriptionMediaStream) {
        throw new Error('Deze browser ondersteunt geen microfoonopname.')
      }
      stream = transcriptionMediaStream || (await navigator.mediaDevices.getUserMedia({ audio: true }))
      usedExistingStream = Boolean(transcriptionMediaStream)
      transcriptionStartMessageRef.current = chatMessage
      transcriptionBufferedTextRef.current = ''
      const session = await startRealtimeTranscription({
        languageCode: 'nl',
        mediaStream: stream,
        onFinalSegment: (segment) => {
          mergeTranscribedText(segment.text)
        },
        onError: (message) => {
          showErrorToast(message || 'Realtime transcriptie is gestopt.')
        },
      })
      transcriptionSessionRef.current = session
      setTranscriptionMediaStream(stream)
      setTranscriptionMode('recording')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Realtime transcriptie starten mislukt.')
      if (stream && !usedExistingStream) {
        stream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {}
        })
      }
      setTranscriptionMode('idle')
    } finally {
      setIsTranscriptionBusy(false)
    }
  }

  async function stopChatTranscription(params: { discard: boolean; releaseStream: boolean }) {
    setIsTranscriptionBusy(true)
    setIsTranscriptionStopping(true)
    try {
      const activeSession = transcriptionSessionRef.current
      transcriptionSessionRef.current = null
      if (activeSession) {
        await activeSession.stop().catch(() => undefined)
      }
      const baseText = transcriptionStartMessageRef.current.trim()
      const bufferedText = transcriptionBufferedTextRef.current.trim()
      const composed = [baseText, bufferedText].filter((value) => value.length > 0).join(' ').trim()
      const finalText = params.discard ? transcriptionStartMessageRef.current : composed
      if (params.discard) {
        transcriptionBufferedTextRef.current = ''
        setChatMessage(transcriptionStartMessageRef.current)
      } else if (params.releaseStream) {
        setChatMessage(composed)
        transcriptionBufferedTextRef.current = ''
      }
      if (params.releaseStream && transcriptionMediaStream) {
        transcriptionMediaStream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch {}
        })
        setTranscriptionMediaStream(null)
      }
      setTranscriptionMode(params.releaseStream ? 'idle' : 'paused')
      if (!params.discard && params.releaseStream && composed.length === 0) {
        showErrorToast('Geen transcript ontvangen. Controleer microfoonrechten en realtime verbinding.')
      }
      return finalText
    } finally {
      setIsTranscriptionStopping(false)
      setIsTranscriptionBusy(false)
    }
  }

  async function resumeChatTranscription() {
    if (isTranscriptionBusy || isChatSending || transcriptionMode !== 'paused' || !transcriptionMediaStream) return
    setIsTranscriptionBusy(true)
    try {
      const session = await startRealtimeTranscription({
        languageCode: 'nl',
        mediaStream: transcriptionMediaStream,
        onFinalSegment: (segment) => {
          mergeTranscribedText(segment.text)
        },
        onError: (message) => {
          showErrorToast(message || 'Realtime transcriptie is gestopt.')
        },
      })
      transcriptionSessionRef.current = session
      setTranscriptionMode('recording')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Realtime transcriptie hervatten mislukt.')
      setTranscriptionMode('paused')
    } finally {
      setIsTranscriptionBusy(false)
    }
  }

  async function sendChatMessage(rawMessage: string) {
    const trimmed = rawMessage.trim()
    if (!trimmed || isChatSending) return
    const structuredFields = structured?.fields
    if (!structuredFields) return
    const requestsAllFields = /\b(alle|elk|ieder)\b[\s\S]*\bveld(?:en)?\b/i.test(trimmed)
    const selectedFieldLines = selectedFieldIds
      .map((fieldId) => {
        const meta = fieldMetaById[fieldId]
        const sourceField = structuredFields[fieldId]
        if (!meta || !sourceField) return null
        const variant = readFieldVariant({
          fieldId,
          numberKey: meta.numberKey,
          fieldType: sourceField.fieldType,
        })
        const singleChoiceOptions = readSingleChoiceOptions(fieldId)
        const singleChoiceKey = readSingleChoiceValueKey(fieldId)
        if ((variant === 'single_choice_numeric' || variant === 'single_choice_with_custom_reason') && singleChoiceOptions.length > 0) {
          if (variant === 'single_choice_with_custom_reason') {
            return `- ${fieldId} (${meta.numberKey}): kies exact 1 optie en sla op als {"${singleChoiceKey}":<nummer>,"customReason":"<tekst>"}. Gebruik customReason alleen bij keuze 6 (Anders) en vul dan verplicht een inhoudelijke toelichting in. Opties: ${singleChoiceOptions.map((option) => `${option.value}=${option.label}`).join(' | ')}`
          }
          return `- ${fieldId} (${meta.numberKey}): kies exact 1 optie en sla op als {"${singleChoiceKey}":<nummer>}. Opties: ${singleChoiceOptions.map((option) => `${option.value}=${option.label}`).join(' | ')}`
        }
        if (variant === 'multi_select_numeric') {
          return `- ${fieldId} (${meta.numberKey}): kies 1 of meer opties en sla op als {"keuzes":[...]} met geldige nummers uit de re-integratieactiviteiten (1 t/m ${REINTEGRATIE_ACTIVITEITEN_OPTIES.length}).`
        }
        if (variant === 'activities_rows') {
          return `- ${fieldId} (${meta.numberKey}): sla op als {"activiteiten":[{"activiteit":"<uitgebreide, concrete omschrijving van 1-3 zinnen>","uren":<nummer>}]} en maak elke activiteit specifiek, toetsbaar en contextgebonden.`
        }
        if (variant === 'activiteiten_en_keuzes') {
          return `- ${fieldId} (${meta.numberKey}): sla op als {"keuzes":[...],"activiteiten":[{"activiteit":"<uitgebreide, concrete omschrijving van 1-3 zinnen>","uren":<nummer>}]} met keuzes uit 1 t/m ${REINTEGRATIE_ACTIVITEITEN_OPTIES.length}; maak activiteiten specifiek en contextgebonden.`
        }
        if (variant === 'uren_motivering') {
          return `- ${fieldId} (${meta.numberKey}): sla op als {"uren":<nummer>,"motivering":"<tekst>"}. Geef beide velden.`
        }
        if (variant === 'tarief_motivering') {
          return `- ${fieldId} (${meta.numberKey}): sla op als {"tarief":<nummer>,"motivering":"<tekst>"}. Geef beide velden.`
        }
        if (variant === 'maanden_object') {
          return `- ${fieldId} (${meta.numberKey}): sla op als {"maanden":<nummer>}.`
        }
        return `- ${fieldId} (${meta.numberKey}): ${meta.label}`
      })
      .filter((line): line is string => Boolean(line))
    const allEditableFieldLines = orderedFieldIds
      .map((fieldId) => {
        const sourceField = structuredFields[fieldId]
        if (!sourceField || sourceField.fieldType !== 'ai') return null
        const meta = fieldMetaById[fieldId]
        if (!meta) return null
        return `- ${fieldId} (${meta.numberKey}): ${meta.label}`
      })
      .filter((line): line is string => Boolean(line))
    const structuredFieldHints = selectedFieldLines.length === 0
      ? orderedFieldIds
          .map((fieldId) => {
            const meta = fieldMetaById[fieldId]
            const sourceField = structuredFields[fieldId]
            if (!meta || !sourceField) return null
            const variant = readFieldVariant({
              fieldId,
              numberKey: meta.numberKey,
              fieldType: sourceField.fieldType,
            })
            if (variant === 'multi_select_numeric') return `- ${fieldId} (${meta.numberKey}): {"keuzes":[...]}`
            if (variant === 'activities_rows') return `- ${fieldId} (${meta.numberKey}): {"activiteiten":[{"activiteit":"...","uren":<nummer>}]}`
            if (variant === 'activiteiten_en_keuzes') return `- ${fieldId} (${meta.numberKey}): {"keuzes":[...],"activiteiten":[{"activiteit":"...","uren":<nummer>}]}`
            return null
          })
          .filter((line): line is string => Boolean(line))
      : []
    const scopedPrompt = selectedFieldLines.length > 0
      ? [
          'Voer wijzigingen uitsluitend door in de volgende rapportvelden:',
          ...selectedFieldLines,
          '',
          'Werk zo volledig mogelijk bij binnen deze scope, maar verzin geen feiten.',
          'Gebruik alleen informatie die uit de context logisch en realistisch volgt.',
          'Bij te weinig basis: laat het veld ongewijzigd in plaats van te gokken.',
          '',
          'Schrijf bij tekstvelden direct de uiteindelijke inhoud, zonder inleidingen zoals "de beschrijving ... is als volgt:".',
          'Schrijf inhoud substantieel en concreet, niet te bondig.',
          'Voor activiteitenvelden: geef per activiteit een uitgebreide praktische omschrijving (1-3 zinnen) plus realistische uren.',
          '',
          'Belangrijk: laat geselecteerde single-choice velden nooit leeg. Kies altijd een geldige optie en zet het bijbehorende nummer in het juiste sleutelveld.',
          '',
          'Gebruikersverzoek:',
          trimmed,
        ].join('\n')
      : [
          ...(requestsAllFields
            ? [
                'De gebruiker vraagt om zoveel mogelijk velden in te vullen.',
                'Pas daarom alle AI-velden toe waar voldoende context voor is.',
                'Gebruik uitsluitend bestaande fieldId waarden uit deze lijst:',
                ...allEditableFieldLines,
                '',
                'Als er voor een veld onvoldoende context is: laat dat veld ongewijzigd.',
                '',
              ]
            : []),
          'Als je een gestructureerd veld aanpast, gebruik exact het vereiste JSON-formaat.',
          'Werk zo volledig mogelijk bij zonder feiten te verzinnen.',
          'Gebruik alleen informatie die realistisch volgt uit de context; niet hallucineren.',
          'Schrijf tekstvelden inhoudelijk en uitgebreid, niet te bondig.',
          'Voor activiteitenvelden: geef concrete, uitgebreide activiteiten (1-3 zinnen per activiteit) met realistische uren.',
          'Schrijf bij tekstvelden direct de uiteindelijke inhoud, zonder inleidingen zoals "de beschrijving ... is als volgt:".',
          ...(structuredFieldHints.length > 0 ? ['Bekende formaten in dit rapport:', ...structuredFieldHints, ''] : []),
          'Gebruikersverzoek:',
          trimmed,
        ].join('\n')
    const userRowId = `user-${Date.now()}`
    const assistantId = `assistant-stream-${Date.now()}`
    const nextRows = [...chatRows, { id: userRowId, role: 'user' as const, text: trimmed }]
    setChatRows((prev) => [...prev, { id: userRowId, role: 'user', text: trimmed }, { id: assistantId, role: 'assistant', text: '' }])
    setChatMessage('')
    setActiveAssistantStreamId(assistantId)
    setIsChatSending(true)
    let sawDelta = false
    const typewriter = createTypewriterStream({
      appendChar: (nextChar) => {
        setChatRows((prev) => prev.map((row) => (row.id === assistantId ? { ...row, text: `${row.text}${nextChar}` } : row)))
      },
    })
    try {
      const response = await streamReportPipelineChatMessage({
        reportId: report.id,
        messages: nextRows.map((row) => ({ role: row.role, text: row.id === userRowId ? scopedPrompt : row.text })),
        onDelta: (delta) => {
          sawDelta = true
          typewriter.pushDelta(delta)
        },
      })
      if (!sawDelta && response.answer) {
        typewriter.pushDelta(response.answer)
      }
      await typewriter.waitUntilIdle()
      typewriter.dispose()
      let reportWithVisibleUpdates: Report = report
      const hasUpdates = hasChatFieldUpdates(response)
      if (hasUpdates) {
        const fieldUpdates = response.fieldUpdates ?? []
        const optimisticReport = applyFieldUpdatesToReport(report, fieldUpdates)
        reportWithVisibleUpdates = optimisticReport
        onReportUpdated(optimisticReport)
        const pollDelaysMs = [150, 300, 500, 750, 1000]
        for (let attempt = 0; attempt < pollDelaysMs.length; attempt += 1) {
          try {
            await new Promise<void>((resolve) => setTimeout(resolve, pollDelaysMs[attempt]))
            const refreshed = await readPipelineReport(report.id)
            if (refreshed && reportContainsFieldUpdates(refreshed, fieldUpdates)) {
              reportWithVisibleUpdates = refreshed
              onReportUpdated(refreshed)
              break
            }
          } catch {
            // Keep optimistic field updates when read endpoint is unavailable.
          }
        }
        if (!reportContainsFieldUpdates(reportWithVisibleUpdates, fieldUpdates)) {
          reportWithVisibleUpdates = optimisticReport
          onReportUpdated(optimisticReport)
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 50))
      }
      const assistantText = response.answer || 'Geen antwoord ontvangen.'
      setChatRows((prev) => prev.map((row) => (row.id === assistantId ? { ...row, text: assistantText } : row)))
    } catch (error) {
      typewriter.dispose()
      setChatRows((prev) => prev.map((row) => (row.id === assistantId ? { ...row, text: error instanceof Error ? error.message : 'Chat mislukt.' } : row)))
    } finally {
      setIsChatSending(false)
      setActiveAssistantStreamId(null)
    }
  }

  async function handleSendChat() {
    if (isChatSending || isTranscriptionBusy) return
    if (transcriptionMode === 'recording' || transcriptionMode === 'paused') {
      const finalizedText = await stopChatTranscription({ discard: false, releaseStream: true })
      const preparedText = String(finalizedText || '').trim()
      if (!preparedText) return
      await sendChatMessage(preparedText)
      return
    }
    await sendChatMessage(chatMessage)
  }

  async function handleExportWord() {
    if (!structured || !template) return
    setIsExporting(true)
    try {
      const didExport = await exportReportToWord({ templateName: template.name, reportText: buildStructuredReportText(template, structured), contextValues: buildStructuredExportContext(template, structured) })
      if (!didExport) showErrorToast('Geen ondersteund UWV-template gevonden voor export.')
      else showToast('Word-export gestart.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Word-export mislukt.')
    } finally { setIsExporting(false) }
  }

  if (!structured) return <View style={styles.emptyWrap}><Text style={styles.emptyText}>Structured report data ontbreekt voor dit rapport.</Text></View>

  const shouldShowChatLoading = isChatSending && !!activeAssistantStreamId && !chatRows.some((row) => row.id === activeAssistantStreamId && row.text.trim().length > 0)
  const toggleFieldSelection = (fieldId: string) => {
    const field = structured.fields[fieldId]
    if (!field) return
    setSelectedFieldIds((prev) => (prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId]))
    setChatComposerFocusTrigger((value) => value + 1)
  }
  const removeFieldSelection = (fieldId: string) => {
    setSelectedFieldIds((prev) => prev.filter((id) => id !== fieldId))
    setChatComposerFocusTrigger((value) => value + 1)
  }
  const isFieldSelected = (fieldId: string) => selectedFieldIds.includes(fieldId)
  const renderFieldBlock = (field: RenderField, label: string, content: React.ReactNode, showFieldAiAction = true) => (
    <View key={field.key} style={[styles.fieldBlock, isFieldSelected(field.sourceFieldId) ? styles.fieldBlockSelected : undefined]}>
      <View style={styles.fieldHeader}>
        <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
        {showFieldAiAction && field.fieldType === 'ai' ? (
          <Pressable
            onPress={() => toggleFieldSelection(field.sourceFieldId)}
            style={({ hovered }) => [
              styles.fieldAiActionButton,
              isFieldSelected(field.sourceFieldId) ? styles.fieldAiActionButtonSelected : undefined,
              hovered ? styles.fieldAiActionButtonHover : undefined,
            ]}
          >
            <StarsIcon size={14} color={isFieldSelected(field.sourceFieldId) ? '#BE0165' : '#667085'} />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.fieldContentWrap}>
        {content}
      </View>
    </View>
  )

  return (
    <View style={styles.root}>
      {showExportButton ? (
        <View style={styles.headerRow}>
          <View style={styles.headerActions}>
            <Pressable onPress={() => void handleExportWord()} style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHover : undefined]}>
              {isExporting ? <ActivityIndicator size="small" color="#007ACF" /> : <View style={styles.exportButtonContent}><ReportUwvLogoIcon /><Text isSemibold style={styles.exportButtonText}>Exporteer naar Word</Text></View>}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.bodyRow}>
        <ScrollView style={styles.fieldsColumn} contentContainerStyle={styles.fieldsContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            const isCollapsed = collapsedBySectionKey[section.key] ?? (section.status === 'complete')
            return (
              <View key={section.key} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text isBold style={styles.sectionTitle}>{section.key}. {section.title}</Text>
                  <View style={styles.sectionHeaderRight}>
                    <View style={[styles.sectionBadge, section.status === 'complete' ? styles.sectionBadgeComplete : styles.sectionBadgeIncomplete]}>
                      <Text style={[styles.sectionBadgeText, section.status === 'complete' ? styles.sectionBadgeTextComplete : styles.sectionBadgeTextIncomplete]}>{section.status === 'complete' ? 'Compleet' : 'Incompleet'}</Text>
                    </View>
                    <Pressable style={({ hovered }) => [styles.chevronWrap, hovered ? styles.chevronWrapHover : undefined]} onPress={() => setCollapsedBySectionKey((p) => ({ ...p, [section.key]: !isCollapsed }))}>
                      <View style={[styles.chevronIconWrap, isCollapsed ? styles.chevronCollapsed : styles.chevronExpanded]}>
                        <ChevronDownIcon color="#344054" size={16} />
                      </View>
                    </Pressable>
                  </View>
                </View>
                {!isCollapsed ? (
                <View style={[styles.sectionContentWrap, styles.sectionContentWrapExpanded]}>
                  {section.fields.map((field) => (
                    (() => {
                    const value = getCurrentAnswer(field.sourceFieldId)
                    const label = field.label

                    if (field.variant === 'split_name') {
                      const textValue = answerToText(value)
                      const split = decomposeNameField(textValue)
                      return renderFieldBlock(field, label, (
                          <View style={styles.nameRow}>
                            <TextInput
                              value={split.initials}
                              onChangeText={(next) => {
                                const nextInitials = formatInitialsForEditing(next, split.initials)
                                setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: composeNameField(nextInitials, split.surname, false) }))
                              }}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.nameField, webNoOutlineInputStyle]}
                              placeholder="Voorletters"
                              placeholderTextColor="#98A2B3"
                              autoCapitalize="characters"
                            />
                            <TextInput
                              value={split.surname}
                              onChangeText={(next) => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: composeNameField(split.initials, capitalizeFirstLetter(next), false) }))}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.nameField, webNoOutlineInputStyle]}
                              placeholder="Achternaam"
                              placeholderTextColor="#98A2B3"
                            />
                          </View>
                      ))
                    }

                    if (field.variant === 'split_address') {
                      const parsed = deserializeAddressSplit(answerToText(value))
                      return renderFieldBlock(field, label, (
                          <View style={styles.addressSplitWrap}>
                            <View style={styles.activityRow}>
                              <TextInput
                                value={parsed.visitPostcode}
                                onChangeText={(next) =>
                                  setDraftByFieldId((p) => ({
                                    ...p,
                                    [field.sourceFieldId]: serializeAddressSplit({
                                      ...parsed,
                                      visitPostcode: next,
                                    }),
                                  }))
                                }
                                multiline={false}
                                style={[styles.answerInput, styles.programmaticHeight, styles.postcodeInput, webNoOutlineInputStyle]}
                                placeholder="Postcode"
                                placeholderTextColor="#98A2B3"
                              />
                              <TextInput
                                value={parsed.visitPlace}
                                onChangeText={(next) =>
                                  setDraftByFieldId((p) => ({
                                    ...p,
                                    [field.sourceFieldId]: serializeAddressSplit({
                                      ...parsed,
                                      visitPlace: next,
                                    }),
                                  }))
                                }
                                multiline={false}
                                style={[styles.answerInput, styles.programmaticHeight, styles.activityInputLarge, webNoOutlineInputStyle]}
                                placeholder="Plaats"
                                placeholderTextColor="#98A2B3"
                              />
                            </View>
                          </View>
                      ))
                    }

                    if (field.variant === 'multi_select_numeric') {
                      const current = asObject(value)
                      const selected = Array.isArray(current?.keuzes) ? current.keuzes.filter((v) => typeof v === 'number') as number[] : []
                      return renderFieldBlock(field, label, (
                          <View style={styles.multichoiceWrap}>
                            {REINTEGRATIE_ACTIVITEITEN_OPTIES.map((option, index) => {
                              const optionValue = index + 1
                              const isSelected = selected.includes(optionValue)
                              return (
                                <Pressable
                                  key={`${field.key}-${optionValue}`}
                                  style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  onPress={() => {
                                    const next = new Set(selected)
                                    if (next.has(optionValue)) next.delete(optionValue)
                                    else next.add(optionValue)
                                    setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { keuzes: Array.from(next).sort((a, b) => a - b) } }))
                                  }}
                                >
                                  <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                    {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                  </View>
                                  <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{optionValue}. {option}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                      ))
                    }

                    if (field.variant === 'single_choice_numeric') {
                      const current = asObject(value)
                      const valueKey = readSingleChoiceValueKey(field.sourceFieldId)
                      const selectedValue = typeof current?.[valueKey] === 'number' ? Number(current[valueKey]) : null
                      const options = readSingleChoiceOptions(field.sourceFieldId)
                      return renderFieldBlock(field, label, (
                        <View style={styles.multichoiceWrap}>
                          {options.map((option) => {
                            const isSelected = selectedValue === option.value
                            return (
                              <Pressable
                                key={`${field.key}-${option.value}`}
                                style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                onPress={() => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...(current || {}), [valueKey]: option.value } }))}
                              >
                                <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                  {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                </View>
                                <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option.label}</Text>
                              </Pressable>
                            )
                          })}
                        </View>
                      ))
                    }

                    if (field.variant === 'single_choice_with_custom_reason') {
                      const current = asObject(value)
                      const selectedReason = typeof current?.reden === 'number' ? Number(current.reden) : null
                      const customReason = String(current?.customReason ?? '')
                      const options = readSingleChoiceOptions(field.sourceFieldId)
                      return renderFieldBlock(field, label, (
                        <>
                          <View style={styles.multichoiceWrap}>
                            {options.map((option) => {
                              const isSelected = selectedReason === option.value
                              return (
                                <Pressable
                                  key={`${field.key}-${option.value}`}
                                  style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  onPress={() =>
                                    setDraftByFieldId((p) => ({
                                      ...p,
                                      [field.sourceFieldId]: {
                                        ...(current || {}),
                                        reden: option.value,
                                        customReason: option.value === 6 ? customReason : '',
                                      },
                                    }))
                                  }
                                >
                                  <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                    {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                  </View>
                                  <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option.label}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                          {selectedReason === 6 ? (
                            <TextInput
                              value={customReason}
                              onChangeText={(next) => {
                                setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...(current || {}), reden: 6, customReason: next } }))
                              }}
                              multiline
                              scrollEnabled={false}
                              style={[styles.answerInput, { height: estimateHeightFromText(customReason, FIVE_LINE_HEIGHT), textAlignVertical: 'top' as any }, webNoOutlineInputStyle]}
                              placeholder="Anders, namelijk"
                              placeholderTextColor="#98A2B3"
                            />
                          ) : null}
                        </>
                      ))
                    }

                    if (field.variant === 'activities_rows') {
                      const objectValue = asObject(value) || {}
                      const activiteiten = Array.isArray(objectValue.activiteiten) ? objectValue.activiteiten : []
                      const rows = repeatableRowsByFieldId[field.sourceFieldId] ?? (activiteiten.length ? activiteiten.map((item, index) => {
                        const row = asObject(item as JsonValue) || {}
                        return { id: `${field.sourceFieldId}-activity-${index}`, activity: String(row.activiteit || ''), hours: String(row.uren ?? '') }
                      }) : [{ id: `${field.sourceFieldId}-activity-0`, activity: '', hours: '' }])
                      const applyRows = (nextRows: Array<{ id: string; activity: string; hours: string }>) => {
                        setRepeatableRowsByFieldId((p) => ({ ...p, [field.sourceFieldId]: nextRows }))
                        setDraftByFieldId((p) => ({
                          ...p,
                          [field.sourceFieldId]: {
                            activiteiten: nextRows
                              .map((row) => ({ activiteit: row.activity.trim(), uren: parseHoursToNumber(row.hours) }))
                              .filter((row) => row.activiteit.length > 0 || row.uren > 0),
                          },
                        }))
                      }
                      return renderFieldBlock(field, label, (
                          <View style={styles.activityRowsWrap}>
                            {rows.map((row, rowIndex) => {
                              const isLastRow = rowIndex === rows.length - 1
                              return (
                              <View key={row.id} style={styles.activityRow}>
                                <TextInput
                                  value={row.activity}
                                  onChangeText={(next) => {
                                    applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, activity: next } : entry)))
                                  }}
                                  multiline
                                  scrollEnabled={false}
                                  style={[styles.answerInput, { height: estimateHeightFromText(row.activity, ONE_LINE_HEIGHT), textAlignVertical: 'top' as any }, styles.activityInputLarge, webNoOutlineInputStyle]}
                                  placeholder="Activiteit"
                                  placeholderTextColor="#98A2B3"
                                />
                                <TextInput
                                  value={row.hours}
                                  onChangeText={(next) => applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, hours: normalizeHoursInput(next) } : entry)))}
                                  multiline={false}
                                  keyboardType="decimal-pad"
                                  inputMode="decimal"
                                  style={[styles.answerInput, styles.activityInputSmall, webNoOutlineInputStyle]}
                                  placeholder="Uren"
                                  placeholderTextColor="#98A2B3"
                                />
                                {isLastRow ? (
                                  <Pressable
                                    style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                    onPress={() => applyRows([...rows, makeActivityRow()])}
                                  >
                                    <PlusIcon size={18} color="#344054" />
                                  </Pressable>
                                ) : null}
                                {rows.length > 1 && !isLastRow ? (
                                  <Pressable
                                    style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                    onPress={() => applyRows(rows.filter((entry) => entry.id !== row.id))}
                                  >
                                    <View style={styles.removeRowIconWrap}>
                                      <PlusIcon size={18} color="#98A2B3" />
                                    </View>
                                  </Pressable>
                                ) : null}
                              </View>
                            )})}
                          </View>
                      ))
                    }

                    if (field.variant === 'activiteiten_en_keuzes') {
                      const current = asObject(value) || {}
                      const selected = Array.isArray(current.keuzes) ? current.keuzes.filter((v) => typeof v === 'number') as number[] : []
                      const activiteiten = Array.isArray(current.activiteiten) ? current.activiteiten : []
                      const rows = repeatableRowsByFieldId[field.sourceFieldId] ?? (activiteiten.length ? activiteiten.map((item, index) => {
                        const row = asObject(item as JsonValue) || {}
                        return { id: `${field.sourceFieldId}-activity-${index}`, activity: String(row.activiteit || ''), hours: String(row.uren ?? '') }
                      }) : [{ id: `${field.sourceFieldId}-activity-0`, activity: '', hours: '' }])
                      const applyRows = (nextRows: Array<{ id: string; activity: string; hours: string }>, nextSelected = selected) => {
                        setRepeatableRowsByFieldId((p) => ({ ...p, [field.sourceFieldId]: nextRows }))
                        setDraftByFieldId((p) => ({
                          ...p,
                          [field.sourceFieldId]: {
                            keuzes: nextSelected,
                            activiteiten: nextRows
                              .map((row) => ({ activiteit: row.activity.trim(), uren: parseHoursToNumber(row.hours) }))
                              .filter((row) => row.activiteit.length > 0 || row.uren > 0),
                          },
                        }))
                      }
                      return renderFieldBlock(field, label, (
                        <>
                          <View style={styles.multichoiceWrap}>
                            {REINTEGRATIE_ACTIVITEITEN_OPTIES.map((option, index) => {
                              const optionValue = index + 1
                              const isSelected = selected.includes(optionValue)
                              return (
                                <Pressable
                                  key={`${field.key}-choice-${optionValue}`}
                                  style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  onPress={() => {
                                    const next = new Set(selected)
                                    if (next.has(optionValue)) next.delete(optionValue)
                                    else next.add(optionValue)
                                    applyRows(rows, Array.from(next).sort((a, b) => a - b))
                                  }}
                                >
                                  <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                    {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                  </View>
                                  <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                          <View style={styles.activityRowsWrap}>
                            {rows.map((row, rowIndex) => {
                              const isLastRow = rowIndex === rows.length - 1
                              return (
                                <View key={row.id} style={styles.activityRow}>
                                  <TextInput
                                    value={row.activity}
                                    onChangeText={(next) => {
                                      applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, activity: next } : entry)))
                                    }}
                                    multiline
                                    scrollEnabled={false}
                                    style={[styles.answerInput, { height: estimateHeightFromText(row.activity, ONE_LINE_HEIGHT), textAlignVertical: 'top' as any }, styles.activityInputLarge, webNoOutlineInputStyle]}
                                    placeholder="Re-integratieactiviteit"
                                    placeholderTextColor="#98A2B3"
                                  />
                                  <TextInput
                                    value={row.hours}
                                    onChangeText={(next) => applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, hours: normalizeHoursInput(next) } : entry)))}
                                    multiline={false}
                                    keyboardType="decimal-pad"
                                    inputMode="decimal"
                                    style={[styles.answerInput, styles.activityInputSmall, webNoOutlineInputStyle]}
                                    placeholder="Uren"
                                    placeholderTextColor="#98A2B3"
                                  />
                                  {isLastRow ? (
                                    <Pressable
                                      style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                      onPress={() => applyRows([...rows, makeActivityRow()])}
                                    >
                                      <PlusIcon size={18} color="#344054" />
                                    </Pressable>
                                  ) : null}
                                  {rows.length > 1 && !isLastRow ? (
                                    <Pressable
                                      style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                      onPress={() => applyRows(rows.filter((entry) => entry.id !== row.id))}
                                    >
                                      <View style={styles.removeRowIconWrap}>
                                        <PlusIcon size={18} color="#98A2B3" />
                                      </View>
                                    </Pressable>
                                  ) : null}
                                </View>
                              )
                            })}
                          </View>
                        </>
                      ))
                    }

                    if (field.variant === 'maanden_object') {
                      const current = asObject(value) || {}
                      return renderFieldBlock(field, label, (
                        <View style={styles.maandenRow}>
                          <TextInput
                            value={String(current.maanden ?? '')}
                            onChangeText={(next) => {
                              const numeric = normalizeNumericInput(next)
                              setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { maanden: numeric.length ? Number(numeric) : '' } }))
                            }}
                            multiline={false}
                            keyboardType="number-pad"
                            style={[styles.answerInput, styles.programmaticHeight, styles.maandenInput, webNoOutlineInputStyle]}
                            placeholder=""
                          />
                          <Text style={styles.maandenSuffix}>maanden</Text>
                        </View>
                      ))
                    }

                    if (field.variant === 'uren_motivering' || field.variant === 'tarief_motivering') {
                      const current = asObject(value) || {}
                      const numberKey = field.variant === 'uren_motivering' ? 'uren' : 'tarief'
                      return renderFieldBlock(field, label, (
                        <View style={styles.verticalFieldStack}>
                          <TextInput
                            value={String(current[numberKey] ?? '')}
                            onChangeText={(next) => {
                              const numeric = normalizeNumericInput(next)
                              setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...current, [numberKey]: numeric.length ? Number(numeric) : '' } }))
                            }}
                            multiline={false}
                            keyboardType="number-pad"
                            style={[styles.answerInput, styles.programmaticHeight, webNoOutlineInputStyle]}
                            placeholder={numberKey === 'uren' ? 'Aantal uren' : 'Tarief'}
                            placeholderTextColor="#98A2B3"
                          />
                          <TextInput
                            value={String(current.motivering ?? '')}
                            onChangeText={(next) => {
                              setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...current, motivering: next } }))
                            }}
                            multiline
                            scrollEnabled={false}
                            style={[styles.answerInput, { height: estimateHeightFromText(String(current.motivering ?? ''), FIVE_LINE_HEIGHT), textAlignVertical: 'top' as any }, webNoOutlineInputStyle]}
                            placeholder="Motivering"
                            placeholderTextColor="#98A2B3"
                          />
                        </View>
                      ))
                    }

                    if (field.variant === 'akkoord_met_toelichting') {
                      const current = asObject(value)
                      const selectedValue = typeof current?.akkoord === 'number' ? Number(current.akkoord) : null
                      const showToelichting = shouldShowAkkoordToelichting(selectedValue)
                      const toelichting = String(current?.toelichting ?? '')
                      const options = readSingleChoiceOptions(field.sourceFieldId)
                      return renderFieldBlock(field, label, (
                        <>
                          <View style={styles.multichoiceWrap}>
                            {options.map((option) => {
                              const isSelected = selectedValue === option.value
                              return (
                                <Pressable
                                  key={`${field.key}-${option.value}`}
                                  style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  onPress={() =>
                                    setDraftByFieldId((p) => ({
                                      ...p,
                                      [field.sourceFieldId]: {
                                        ...(current || {}),
                                        akkoord: option.value,
                                        toelichting,
                                      },
                                    }))
                                  }
                                >
                                  <View style={[styles.choiceCircle, isSelected ? styles.choiceCircleSelected : undefined]}>
                                    {isSelected ? <View style={styles.choiceCircleInner} /> : null}
                                  </View>
                                  <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option.label}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                          {showToelichting ? (
                            <TextInput
                              value={toelichting}
                              onChangeText={(next) => {
                                setDraftByFieldId((p) => ({
                                  ...p,
                                  [field.sourceFieldId]: { ...(current || {}), akkoord: selectedValue ?? '', toelichting: next },
                                }))
                              }}
                              multiline
                              scrollEnabled={false}
                              style={[styles.answerInput, { height: estimateHeightFromText(toelichting, FIVE_LINE_HEIGHT), textAlignVertical: 'top' as any }, webNoOutlineInputStyle]}
                              placeholder="Toelichting"
                              placeholderTextColor="#98A2B3"
                            />
                          ) : null}
                        </>
                      ))
                    }

                    const textValue = answerToText(value)
                    const isOneLine = field.fieldType === 'programmatic' || field.numberKey === '1.2'
                    const baseInput = (
                      <TextInput
                        value={textValue}
                        onChangeText={(next) => {
                          setDraftByFieldId((p) => ({
                            ...p,
                            [field.sourceFieldId]: field.numberKey === '1.2' ? normalizeNumericInput(next) : next,
                          }))
                        }}
                        multiline={!isOneLine}
                        scrollEnabled={isOneLine ? undefined : false}
                        keyboardType={field.numberKey === '1.2' ? 'number-pad' : undefined}
                        inputMode={field.numberKey === '1.2' ? 'numeric' : undefined}
                        style={[
                          styles.answerInput,
                          isOneLine ? styles.programmaticHeight : { height: estimateHeightFromText(textValue, FIVE_LINE_HEIGHT), textAlignVertical: 'top' as any },
                          webNoOutlineInputStyle,
                        ]}
                        placeholder={field.numberKey === '6.1' ? '' : 'Typ hier het antwoord...'}
                        placeholderTextColor="#98A2B3"
                      />
                    )
                    return renderFieldBlock(field, label, baseInput)
                  })()
                  ))}
                </View>
                ) : null}
              </View>
            )
          })}
        </ScrollView>

        <View style={styles.chatColumn}>
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Text isSemibold style={styles.chatTitle}>Rapply</Text>
              {chatRows.length > 0 ? (
                <Pressable
                  onPress={() => setIsClearChatModalVisible(true)}
                  style={({ hovered }) => [styles.chatClearButton, hovered ? styles.chatClearButtonHover : undefined]}
                >
                  <Text isSemibold style={styles.chatClearButtonText}>Wissen</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView ref={chatScrollRef} style={[styles.chatMessages, { scrollbarColor: '#C7C9CE transparent' } as any]} contentContainerStyle={styles.chatMessagesContent}>
              {chatRows.map((row) => {
                const isHiddenStreamingPlaceholder = row.role === 'assistant' && row.id === activeAssistantStreamId && row.text.trim().length === 0
                if (isHiddenStreamingPlaceholder) return null
                const isStreamingMessage = isChatSending && row.id === activeAssistantStreamId
                return <ChatMessage key={row.id} role={row.role} text={row.text} isStreaming={isStreamingMessage} />
              })}
              {shouldShowChatLoading
                ? <ChatMessage role="assistant" text="" isLoading />
                : null}
            </ScrollView>
            <Animated.View style={[styles.chatFieldSelectionAnimatedWrap, { height: scopeHeightAnimation, opacity: scopeOpacityAnimation }]}>
              {selectedFieldIds.length > 0 ? (
                <View
                  style={styles.chatFieldSelectionWrap}
                  onLayout={(event) => {
                    const nextHeight = Math.ceil(event.nativeEvent.layout.height || 0)
                    if (!nextHeight) return
                    setScopeContentHeight(nextHeight)
                  }}
                >
                  <View style={styles.chatFieldSelectionHeader}>
                    <Text isSemibold style={styles.chatFieldSelectionTitle}>Geselecteerde vragen</Text>
                    <Pressable
                      onPress={() => {
                        setSelectedFieldIds([])
                        setChatComposerFocusTrigger((value) => value + 1)
                      }}
                      style={({ hovered }) => [styles.chatFieldSelectionClearAll, hovered ? styles.chatFieldSelectionClearAllHover : undefined]}
                    >
                      <CircleCloseIcon size={16} color="#667085" />
                    </Pressable>
                  </View>
                  <View style={styles.chatFieldSelectionChips}>
                    {selectedFieldIds.map((fieldId) => {
                      const meta = fieldMetaById[fieldId]
                      if (!meta) return null
                      return (
                        <View key={fieldId} style={styles.chatFieldSelectionChip}>
                          <Text style={styles.chatFieldSelectionChipText}>{meta.numberKey || fieldId}</Text>
                          <Pressable onPress={() => removeFieldSelection(fieldId)} style={({ hovered }) => [styles.chatFieldSelectionRemove, hovered ? styles.chatFieldSelectionRemoveHover : undefined]}>
                            <CircleCloseIcon size={14} color="#667085" />
                          </Pressable>
                        </View>
                      )
                    })}
                  </View>
                </View>
              ) : null}
            </Animated.View>
            <View style={styles.chatComposerWrap}>
              {isTranscriptionActive ? (
                <View style={styles.transcriptionComposerRow}>
                  <View style={styles.transcriptionControls}>
                    <Pressable
                      style={({ hovered }) => [styles.transcriptionActionButton, hovered ? styles.transcriptionActionButtonHover : undefined]}
                      onPress={() => void stopChatTranscription({ discard: true, releaseStream: true })}
                      disabled={isTranscriptionBusy || isChatSending}
                    >
                      <CircleCloseIcon size={14} color="#667085" />
                    </Pressable>
                    <Pressable
                      style={({ hovered }) => [styles.transcriptionActionButton, hovered ? styles.transcriptionActionButtonHover : undefined]}
                      onPress={() => {
                        if (transcriptionMode === 'recording') void stopChatTranscription({ discard: false, releaseStream: false })
                        else if (transcriptionMode === 'paused') void resumeChatTranscription()
                      }}
                      disabled={isTranscriptionBusy || isChatSending}
                    >
                      {transcriptionMode === 'paused'
                        ? (
                          <View style={styles.playIconWrap}>
                            <PlaySmallIcon size={10} color="#667085" />
                          </View>
                          )
                        : <PauseIcon size={14} color="#667085" />}
                    </Pressable>
                    <Pressable
                      style={({ hovered }) => [styles.transcriptionActionButton, hovered ? styles.transcriptionActionButtonHover : undefined]}
                      onPress={() => void stopChatTranscription({ discard: false, releaseStream: true })}
                      disabled={isTranscriptionBusy || isChatSending}
                    >
                      <StopSquareIcon size={14} color="#667085" />
                    </Pressable>
                  </View>
                  <View style={styles.waveformInline}>
                    {waveHistory.map((nextHeight, index) => {
                      const highlightIndex = waveHistory.length - 1 - (silentPhase % Math.max(1, waveHistory.length))
                      const silentOpacity = index === highlightIndex ? 1 : 0.35
                      return (
                        <View
                          key={`wave-${index}`}
                          style={[
                            styles.waveformInlineBar,
                            isWaveSilent ? styles.waveformInlineBarSilent : undefined,
                            { height: nextHeight, opacity: isWaveSilent ? silentOpacity : 1 },
                          ]}
                        />
                      )
                    })}
                  </View>
                  <Pressable
                    onPress={() => void handleSendChat()}
                    style={({ hovered }) => [
                      styles.transcriptionSendButton,
                      (isChatSending || isTranscriptionBusy) ? styles.transcriptionSendButtonDisabled : undefined,
                      hovered ? styles.transcriptionSendButtonHover : undefined,
                    ]}
                    disabled={isChatSending || isTranscriptionBusy}
                  >
                    <ArrowUpIcon color="#FFFFFF" size={16} />
                  </Pressable>
                </View>
              ) : (
                <ChatComposer
                  value={chatMessage}
                  onChangeValue={handleChatComposerChange}
                  onSend={() => void handleSendChat()}
                  showDisclaimer={false}
                  sendIconVariant="arrow"
                  isSendDisabled={isChatSending || isTranscriptionBusy || chatMessage.trim().length === 0}
                  focusTrigger={chatComposerFocusTrigger}
                  inputPlaceholder=""
                  rowBackgroundColor="transparent"
                />
              )}
            </View>
            {isTranscriptionStopping ? (
              <View pointerEvents="none" style={styles.transcriptionStoppingOverlay}>
                <ActivityIndicator size="small" color="#667085" />
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <ConfirmChatClearModal
        visible={isClearChatModalVisible}
        onClose={() => setIsClearChatModalVisible(false)}
        onConfirm={() => {
          setIsClearChatModalVisible(false)
          setChatRows([])
          setChatMessage('')
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 8, paddingHorizontal: 0, paddingBottom: 12, backgroundColor: '#F7F5F8' },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exportButton: { borderWidth: 1, borderColor: '#007ACF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  exportButtonHover: { backgroundColor: '#EFF7FF' },
  exportButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportButtonText: { color: '#007ACF' },
  bodyRow: { flex: 1, flexDirection: 'row', gap: 16 },
  fieldsColumn: { flex: 1 },
  fieldsContent: { gap: 10, paddingBottom: 28 },
  sectionCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, color: '#2C111F' },
  sectionBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  sectionBadgeComplete: { backgroundColor: '#D4FDE5' },
  sectionBadgeIncomplete: { backgroundColor: '#FEE2E2' },
  sectionBadgeText: { fontSize: 12 },
  sectionBadgeTextComplete: { color: '#008234' },
  sectionBadgeTextIncomplete: { color: '#B91C1C' },
  chevronWrap: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chevronWrapHover: { backgroundColor: '#E7EAF0' },
  chevronIconWrap: { transitionProperty: 'transform', transitionDuration: '220ms', transitionTimingFunction: 'ease' } as any,
  chevronCollapsed: { transform: [{ rotate: '0deg' }] },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  sectionContentWrap: { transitionProperty: 'opacity, padding-top', transitionDuration: '200ms', transitionTimingFunction: 'ease' } as any,
  sectionContentWrapExpanded: { opacity: 1, paddingTop: 4 },
  fieldBlock: { gap: 8, marginTop: 4, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, backgroundColor: '#FFFFFF' },
  fieldBlockSelected: { borderColor: '#BE0165', backgroundColor: '#FFF2F9' },
  fieldLabel: { fontSize: 13, color: '#344054' },
  fieldContentWrap: { position: 'relative' },
  fieldHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  fieldAiActionButton: { width: 22, height: 22, minWidth: 22, minHeight: 22, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  fieldAiActionButtonSelected: { borderColor: '#BE0165', backgroundColor: '#FFF2F9' },
  fieldAiActionButtonHover: { backgroundColor: '#F8FAFC' },
  nameRow: { flexDirection: 'row', gap: 8 },
  nameField: { flex: 1 },
  answerInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  programmaticHeight: { minHeight: ONE_LINE_HEIGHT },
  fiveLineHeight: { minHeight: FIVE_LINE_HEIGHT, textAlignVertical: 'top' as any },
  maandenRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  maandenInput: { width: 120 },
  maandenSuffix: { color: '#475467', fontSize: 13 },
  multichoiceWrap: { gap: 8 },
  choiceRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 8 },
  choiceRowHovered: { backgroundColor: '#F8FAFC' },
  choiceCircle: { width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0, borderRadius: 999, borderWidth: 1, borderColor: '#B7BCC5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  choiceCircleSelected: { borderColor: '#BE0165' },
  choiceCircleInner: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#BE0165' },
  choiceSquare: { width: 20, height: 20, minWidth: 20, minHeight: 20, flexShrink: 0, borderRadius: 999, borderWidth: 1.5, borderColor: '#B7BCC5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  choiceSquareSelected: { borderColor: '#BE0165' },
  choiceSquareInner: { width: 12, height: 12, borderRadius: 999, backgroundColor: '#BE0165' },
  choiceRowText: { fontSize: 14, color: '#2C111F' },
  choiceRowTextSelected: { color: '#BE0165' },
  verticalFieldStack: { gap: 8 },
  activityRowsWrap: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressSplitWrap: { gap: 8 },
  activityInputLarge: { flex: 1 },
  activityInputSmall: { width: HOUR_INPUT_SIZE, minHeight: ONE_LINE_HEIGHT, textAlign: 'center' as any, textAlignVertical: 'center' as any },
  postcodeInput: { width: 120 },
  rowActionButton: { width: ROW_ACTION_SIZE, height: ROW_ACTION_SIZE, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  rowActionButtonHover: { backgroundColor: '#EEF2F7' },
  removeRowIconWrap: { transform: [{ rotate: '45deg' }] },
  chatColumn: { width: 400 },
  chatCard: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  chatHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatTitle: { fontSize: 16, color: '#2C111F' },
  chatClearButton: { minHeight: 24, justifyContent: 'center' },
  chatClearButtonHover: { opacity: 0.7 },
  chatClearButtonText: { fontSize: 13, lineHeight: 16, color: '#344054' },
  chatMessages: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chatMessagesContent: { gap: 10, paddingBottom: 24 },
  chatFieldSelectionAnimatedWrap: { overflow: 'hidden' },
  chatFieldSelectionWrap: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, gap: 8 },
  chatFieldSelectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatFieldSelectionTitle: { fontSize: 12, color: '#667085' },
  chatFieldSelectionClearAll: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  chatFieldSelectionClearAllHover: { backgroundColor: '#F2F4F7' },
  chatFieldSelectionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chatFieldSelectionChip: { minHeight: 28, maxWidth: '100%', borderRadius: 999, borderWidth: 1, borderColor: '#FBCFE8', backgroundColor: '#FFF2F9', paddingLeft: 10, paddingRight: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatFieldSelectionChipText: { fontSize: 12, color: '#9D174D' },
  chatFieldSelectionRemove: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  chatFieldSelectionRemoveHover: { backgroundColor: '#FCE7F3' },
  chatComposerWrap: { padding: 10, position: 'relative' },
  transcriptionComposerRow: {
    width: '100%',
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: 'transparent',
    paddingLeft: 12,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  transcriptionControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  transcriptionActionButton: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transcriptionActionButtonHover: { backgroundColor: '#E5E7EB' },
  playIconWrap: { transform: [{ translateX: 1 }, { translateY: -0.5 }] },
  transcriptionTrailingWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  transcriptionSendButton: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#BE0165', alignItems: 'center', justifyContent: 'center' },
  transcriptionSendButtonHover: { backgroundColor: '#A50058' },
  transcriptionSendButtonDisabled: { opacity: 0.5 },
  transcriptionMicWrap: { overflow: 'hidden' },
  transcriptionMicButton: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  transcriptionMicButtonHover: { backgroundColor: '#E5E7EB' },
  transcriptionMicButtonDisabled: { opacity: 0.5 },
  waveformInline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 16, paddingHorizontal: 0 },
  waveformInlineBar: { width: 3, borderRadius: 999, backgroundColor: '#BE0165' },
  waveformInlineBarSilent: { width: 4, height: 4, borderRadius: 999 },
  transcriptionStoppingOverlay: { position: 'absolute', left: 10, right: 10, top: 10, bottom: 10, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#2C111F' },
})


