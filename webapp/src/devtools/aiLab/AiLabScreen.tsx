import React, { useEffect, useMemo, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { getServerChatPolicyPrompt } from '../../api/chat/getServerChatPolicyPrompt'
import { previewClientChatCompletion } from '../../api/chat/previewClientChatCompletion'
import type { LocalChatMessage } from '../../api/chat/types'
import { setAdminTranscriptionMode } from '../../api/admin/adminApi'
import { exportUwvTemplateWord } from '../../api/export/uwv/exportToUWVWordDocument'
import { previewSnippetExtraction } from '../../api/snippets/previewSnippetExtraction'
import { generateReportFromSource } from '../../api/reports/generateReport'
import { buildClientKnowledge } from '../../api/snippets/buildClientKnowledge'
import { transcribeAudioFile } from '../../api/transcription/batch/transcribeAudioFile'
import {
  fetchRealtimeTranscriptionRuntime,
  startRealtimeTranscription,
  type RealtimeTranscriberSession,
} from '../../api/transcription/realtime/startRealtimeTranscription'
import { buildCoacheeStructuredSystemMessages, buildConversationTranscriptSystemMessages } from '../../content/assistantContext'
import type { Snippet } from '../../types/snippet'
import { Text } from '../../ui/Text'

type ToolId = 'transcription' | 'snippet-creation' | 'client-knowledge-build' | 'create-report' | 'chat-messaging' | 'export-word'
type TranscriptionMode = 'batch' | 'realtime'
type SnippetSourceType = 'transcript' | 'spoken_recap' | 'written_recap'
type SnippetInputMode = 'text' | 'realtime'
type KnowledgeBuildMode = 'create_snippets' | 'add_snippets'
type ChatSnippetScope = 'session' | 'client'
type ReportType = 'reintegratieplan_werkfit' | 'eindrapportage_werkfit' | 'vrij_verslag'
type ExportWordTemplateId = 'reintegratieplan_werkfit' | 'eindrapportage_werkfit'
type ExportWordFieldDef = {
  key: string
  label: string
  multiline?: boolean
}

const toolOptions: { value: ToolId; label: string }[] = [
  { value: 'transcription', label: 'Transcription' },
  { value: 'snippet-creation', label: 'Snippet creation' },
  { value: 'client-knowledge-build', label: 'Client knowledge build' },
  { value: 'create-report', label: 'Create report' },
  { value: 'chat-messaging', label: 'Chat messaging' },
  { value: 'export-word', label: 'Export to Word' },
]

const reportTypeOptions: { value: ReportType; label: string; templateName: string }[] = [
  { value: 'reintegratieplan_werkfit', label: 'Re-integratieplan werkfit maken', templateName: 'Re-integratieplan werkfit maken' },
  { value: 'eindrapportage_werkfit', label: 'Eindrapportage werkfit maken', templateName: 'Eindrapportage werkfit maken' },
  { value: 'vrij_verslag', label: 'Vrij verslag', templateName: 'Vrij verslag' },
]

const exportWordTemplateOptions: { value: ExportWordTemplateId; label: string; templateName: string }[] = [
  { value: 'reintegratieplan_werkfit', label: 'Re-integratieplan werkfit maken', templateName: 'Re-integratieplan werkfit maken' },
  { value: 'eindrapportage_werkfit', label: 'Eindrapportage werkfit maken', templateName: 'Eindrapportage werkfit maken' },
]

const exportWordContextFields: Record<ExportWordTemplateId, ExportWordFieldDef[]> = {
  reintegratieplan_werkfit: [
    { key: '1_1_voorletters', label: '1.1 Voorletters cliënt' },
    { key: '1_1_achternaam', label: '1.1 Achternaam cliënt' },
    { key: '1_2', label: '1.2 BSN cliënt' },
    { key: '3_1', label: '3.1 Naam organisatie' },
    { key: '3_2', label: '3.2 Bezoekadres (straat + nummer)' },
    { key: '3_3', label: '3.3 Postadres' },
    { key: 'postadres_postcode', label: '3.4 Postcode' },
    { key: 'postadres_plaats', label: '3.4 Plaats' },
    { key: '3_5', label: '3.5 Naam contactpersoon' },
    { key: '3_6', label: '3.6 Functie contactpersoon' },
    { key: '3_7', label: '3.7 Telefoonnummer contactpersoon' },
    { key: '3_8', label: '3.8 E-mailadres contactpersoon' },
    { key: '4_1', label: '4.1 Ordernummer' },
    { key: '5_3', label: '5.3 Activiteiten + uren (formaat: Activiteit (2 uur); ...)', multiline: true },
    { key: '8_2_aantal_uren', label: '8.2 Aantal uren specialistische expertise' },
    { key: '8_2_motivering', label: '8.2 Motivering specialistische expertise', multiline: true },
    { key: '8_3a', label: '8.3a Uurtarief exclusief btw' },
    { key: '8_3b', label: '8.3b Motivering uurtarief', multiline: true },
    { key: '10_ondertekening_contactpersoon_re_integratiebedrijf_naam', label: 'Ondertekening naam contactpersoon' },
    { key: '10_ondertekening_client_naam', label: 'Ondertekening naam cliënt' },
  ],
  eindrapportage_werkfit: [
    { key: '1_1_voorletters', label: '1.1 Voorletters cliënt' },
    { key: '1_1_achternaam', label: '1.1 Achternaam cliënt' },
    { key: '1_2', label: '1.2 BSN cliënt' },
    { key: '3_1', label: '3.1 Naam organisatie' },
    { key: '3_2', label: '3.2 Naam contactpersoon' },
    { key: '3_3', label: '3.3 Functie contactpersoon' },
    { key: '3_4', label: '3.4 Telefoonnummer contactpersoon' },
    { key: '3_5', label: '3.5 E-mailadres contactpersoon' },
    { key: '4_1', label: '4.1 Ordernummer' },
    { key: '9_ondertekening_contactpersoon_re_integratiebedrijf_naam', label: 'Ondertekening naam contactpersoon' },
    { key: '9_ondertekening_client_naam', label: 'Ondertekening naam cliënt' },
  ],
}

function nowMs(): number {
  return Date.now()
}

function createSnippet(params: {
  clientId: string
  sessionId: string
  field: string
  text: string
  type?: 'report' | 'knowledge'
}): Snippet {
  const timestamp = nowMs()
  return {
    id: `lab-${timestamp}-${Math.random().toString(16).slice(2, 8)}`,
    clientId: params.clientId,
    sessionId: params.sessionId,
    type: params.type || 'report',
    field: String(params.field || 'manual'),
    text: String(params.text || '').trim(),
    status: 'approved',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

function parseJsonArray<T>(raw: string): T[] {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return []
  const parsed = JSON.parse(trimmed)
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array.')
  return parsed as T[]
}

function parseJsonObject(raw: string): Record<string, string | null | undefined> {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return {}
  const parsed = JSON.parse(trimmed)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected JSON object.')
  return parsed as Record<string, string | null | undefined>
}

function formatDateFromEpoch(epochMs: number): string {
  if (!Number.isFinite(epochMs)) return ''
  const date = new Date(epochMs)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function reportFieldMappingLines(templateName: string): string[] {
  const normalized = String(templateName || '').toLowerCase()
  if (normalized.includes('re-integratieplan werkfit maken') || normalized.includes('reintegratieplan werkfit maken')) {
    return [
      'rp_werkfit_5_1 -> "Welke hoofdactiviteiten zijn in het werkplan of Plan van aanpak benoemd?"',
      'rp_werkfit_5_2 -> "Beschrijving van de activiteiten en het gewenste resultaat"',
      'rp_werkfit_5_3 -> "Hoe verdeelt U de begeleidingsuren over de re-integratieactiviteiten?"',
      'rp_werkfit_5_4 -> "Wanneer begint de eerste re-integratieactiviteit?"',
      'rp_werkfit_5_5 -> "Afspraken en inspanningen van beide partijen"',
      'rp_werkfit_5_6 -> "Afwijkingen van werkplan/Plan van aanpak en waarom"',
      'rp_werkfit_6_1 -> "Wat is de maximale individuele doorlooptijd van de re-integratiedienst?"',
      'rp_werkfit_7_1 -> "Wat verwacht de client van inzet/resultaat en begeleiding?"',
      'rp_werkfit_7_2 -> "Wat is uw visie op de re-integratiemogelijkheden van de client?"',
      'rp_werkfit_7_3 -> "Wat verwacht de client van inzet en resultaat?"',
      'rp_werkfit_8_1 -> "Is er sprake van specialistisch uurtarief?"',
      'rp_werkfit_8_2 -> "Welke specialistische expertise is nodig en hoeveel uren?"',
      'rp_werkfit_8_3 -> "Wat is het specialistische uurtarief en waarom noodzakelijk?"',
    ]
  }
  if (normalized.includes('eindrapportage werkfit maken')) {
    return [
      'er_werkfit_4_2 -> "Van welke eindsituatie is sprake?"',
      'er_werkfit_5_1 -> "Reden beeindiging naar aanleiding van evaluatiemoment"',
      'er_werkfit_5_2 -> "Wat is uw advies voor het vervolg van de dienstverlening?"',
      'er_werkfit_6_1 -> "Reden van de voortijdige terugmelding"',
      'er_werkfit_6_2 -> "Toelichting op de reden van de voortijdige terugmelding"',
      'er_werkfit_6_3 -> "Met wie bij UWV is de voortijdige terugmelding besproken?"',
      'er_werkfit_7_1 -> "Welke activiteiten zijn uitgevoerd en hoeveel uren zijn ingezet?"',
      'er_werkfit_7_2 -> "Welke vorderingen heeft de klant gemaakt?"',
      'er_werkfit_7_3 -> "Wat is het bereikte resultaat?"',
      'er_werkfit_7_4 -> "Onderbouwing werkfit/niet werkfit"',
      'er_werkfit_7_5 -> "Is de klant naar eigen mening werkfit? Waaruit blijkt dat?"',
      'er_werkfit_7_6 -> "Wat is uw vervolgadvies en welke begeleiding is nog nodig?"',
      'er_werkfit_7_7 -> "Toelichting op het advies"',
      'er_werkfit_7_8 -> "Wat vindt de klant van dit advies?"',
      'er_werkfit_8_1 -> "Hoe heeft de klant de ingezette activiteiten ervaren?"',
      'er_werkfit_8_2 -> "Is de klant akkoord met de ingezette/verantwoorde uren?"',
    ]
  }
  return []
}

function buildReportInputFromSnippets(params: {
  templateName: string
  snippets: Snippet[]
}): string {
  const normalizedTemplate = String(params.templateName || '').toLowerCase()
  const fieldPrefix = normalizedTemplate.includes('re-integratieplan werkfit maken') || normalizedTemplate.includes('reintegratieplan werkfit maken')
    ? 'rp_werkfit_'
    : normalizedTemplate.includes('eindrapportage werkfit maken')
      ? 'er_werkfit_'
      : ''
  const grouped = new Map<string, Snippet[]>()
  for (const snippet of params.snippets.filter((item) => item.status === 'approved')) {
    const field = String(snippet.field || '').trim().toLowerCase()
    if (fieldPrefix && field && field !== 'general' && !field.startsWith(fieldPrefix)) continue
    const key = String(snippet.sessionId || '').trim() || 'onbekende-sessie'
    const current = grouped.get(key) || []
    current.push(snippet)
    grouped.set(key, current)
  }

  const sessionBlocks = [...grouped.entries()].map(([sessionKey, sessionSnippets]) => {
    const sorted = [...sessionSnippets].sort((a, b) => a.createdAt - b.createdAt)
    const sessionDate = formatDateFromEpoch(sorted[0]?.createdAt || Date.now())
    const relevantLines = sorted
      .filter((snippet) => String(snippet.field || '').toLowerCase() !== 'general')
      .map((snippet) => {
        const field = String(snippet.field || '').trim()
        const status = String(snippet.status || '').trim()
        const text = String(snippet.text || '').trim()
        return `- [field=${field}] [status=${status}] ${text}`
      })
    const generalLines = sorted
      .filter((snippet) => String(snippet.field || '').toLowerCase() === 'general')
      .map((snippet) => {
        const status = String(snippet.status || '').trim()
        const text = String(snippet.text || '').trim()
        return `- [field=general] [status=${status}] ${text}`
      })
    return [
      `Input op ${sessionDate || '-'}`,
      'Relevante snippets:',
      ...(relevantLines.length > 0 ? relevantLines : ['Er zijn geen relevante snippets.']),
      'Algemene snippets:',
      ...(generalLines.length > 0 ? generalLines : ['Er zijn geen algemene snippets.']),
    ].join('\n')
  })

  return [`Template: ${params.templateName}`, '', ...sessionBlocks].join('\n').trim()
}

function buttonLabel(isLoading: boolean, idle: string, running: string): string {
  return isLoading ? running : idle
}

function parseFieldMappingLine(line: string): { key: string; question: string } | null {
  const [rawKey, rawQuestion] = String(line || '').split('->')
  const key = String(rawKey || '').trim()
  const question = String(rawQuestion || '').replace(/^"/, '').replace(/"$/, '').trim()
  if (!key || !question) return null
  return { key, question }
}

function exportWordReportFields(templateId: ExportWordTemplateId): ExportWordFieldDef[] {
  const templateName = exportWordTemplateOptions.find((item) => item.value === templateId)?.templateName || ''
  return reportFieldMappingLines(templateName)
    .map(parseFieldMappingLine)
    .filter((item): item is { key: string; question: string } => item !== null)
    .map((item) => ({ key: item.key, label: `${item.key} - ${item.question}`, multiline: true }))
}

function allExportWordFields(templateId: ExportWordTemplateId): ExportWordFieldDef[] {
  return [...exportWordContextFields[templateId], ...exportWordReportFields(templateId)]
}

function buildRealisticClientChatContextMessages(): LocalChatMessage[] {
  return buildCoacheeStructuredSystemMessages({
    coacheeName: 'Jan de Vries',
    coacheeCreatedAtUnixMs: Date.parse('2025-11-01T10:00:00Z'),
    clientDetails: JSON.stringify({
      initials: 'J.',
      lastName: 'de Vries',
      email: 'jan@example.com',
      city: 'Utrecht',
    }),
    employerDetails: JSON.stringify({
      organizationName: 'DeltaLogistiek BV',
      contactName: 'M. Jansen',
    }),
    firstSickDay: '2024-09-12',
    sessions: [
      {
        title: 'Intake',
        createdAtUnixMs: Date.parse('2026-01-10T09:00:00Z'),
        summary: 'Client ervaart stress bij terugkeer naar werk. Er is behoefte aan ritmeopbouw en een helder opbouwplan.',
        reportText: 'Tijdens de intake is afgesproken om belastbaarheid rustig op te bouwen en arbeidsmarktoriÃ«ntatie pas later te starten.',
        reportDate: '2026-01-10',
        wvpWeekNumber: '16',
        reportFirstSickDay: '2024-09-12',
      },
      {
        title: 'Voortgang week 4',
        createdAtUnixMs: Date.parse('2026-02-07T09:00:00Z'),
        summary: 'Client heeft twee netwerkgesprekken gevoerd en werkt stabieler volgens dagstructuur.',
        reportText: null,
        reportDate: '2026-02-07',
        wvpWeekNumber: '20',
        reportFirstSickDay: '2024-09-12',
      },
    ],
    snippets: [
      { sessionId: 'sessie-intake', field: 'rp_werkfit_5_5', text: 'Coach en client hebben afgesproken wekelijks voortgang te bespreken.' },
      { sessionId: 'sessie-week-4', field: 'er_werkfit_7_2', text: 'Client heeft twee netwerkgesprekken gevoerd.' },
      { sessionId: 'sessie-week-4', field: 'general', text: 'Client noemt steun van partner als helpende factor.' },
    ],
    maxTotalCharacters: 12000,
    maxSessionCharacters: 2200,
  })
}

function buildRealisticSessionChatContextMessages(): LocalChatMessage[] {
  return [
    ...buildConversationTranscriptSystemMessages({
      sessionId: 'dev-session-001',
      transcript: [
        '[00:10] coach: Hoe ging de week?',
        '[00:12] client: Ik heb twee netwerkgesprekken gevoerd en mijn dagstructuur lukt beter.',
        '[01:24] coach: Wat blijft lastig?',
        '[01:26] client: Ik raak nog gespannen als ik denk aan terugkeer bij mijn oude werkgever.',
      ].join('\n'),
      writtenReportText:
        'Korte rapportage: voortgang zichtbaar in ritme en arbeidsmarktoriÃ«ntatie. Spanning rond terugkeer bij oude werkgever blijft een belemmering.',
    }),
    {
      role: 'system',
      text:
        'Deze chatbot bevindt zich onder het kopje "Snelle vragen". Gebruik alleen informatie uit dit verslag en uit de vraag van de gebruiker. Noem alleen actiepunten die expliciet in de verslagcontext of vraag staan.',
    },
  ]
}

function formatSnippetLine(snippet: Snippet): string {
  const field = String(snippet.field || 'general').trim() || 'general'
  const text = String(snippet.text || '').trim()
  return `- [${field}] ${text}`
}

function buildSnippetSystemMessage(params: { snippets: Snippet[]; scope: ChatSnippetScope }): LocalChatMessage[] {
  const { snippets, scope } = params
  const approvedSnippets = snippets.filter((snippet) => snippet.status === 'approved' && String(snippet.text || '').trim())
  if (approvedSnippets.length === 0) return []

  if (scope === 'session') {
    return [
      {
        role: 'system',
        text: ['Snippets uit de huidige sessie:', '', ...approvedSnippets.map(formatSnippetLine), ''].join('\n'),
      },
    ]
  }

  const groupedByDate = new Map<string, Snippet[]>()
  for (const snippet of approvedSnippets) {
    const key = formatDateFromEpoch(Number(snippet.createdAt) || Date.now()) || '-'
    const current = groupedByDate.get(key) || []
    current.push(snippet)
    groupedByDate.set(key, current)
  }

  const dateBlocks = [...groupedByDate.entries()]
    .sort(([a], [b]) => (a > b ? -1 : a < b ? 1 : 0))
    .map(([dateKey, dateSnippets]) => [dateKey, ...dateSnippets.map(formatSnippetLine), ''].join('\n'))

  return [
    {
      role: 'system',
      text: ['Snippets binnen deze cliÃ«nt:', '', ...dateBlocks].join('\n\n'),
    },
  ]
}

function buildDeterministicReportFields(params: {
  templateName: string
  snippets: Snippet[]
}): { template_name: string; fields: Record<string, string> } {
  const mappingLines = reportFieldMappingLines(params.templateName)
  const fieldKeys = mappingLines.map((line) => line.split(' -> ')[0]?.trim()).filter(Boolean)
  const fields: Record<string, string> = {}

  for (const key of fieldKeys) {
    const matchingText = params.snippets
      .filter((snippet) => snippet.status === 'approved')
      .filter((snippet) => String(snippet.field || '').trim() === key)
      .map((snippet) => String(snippet.text || '').trim())
      .filter(Boolean)
    fields[key] = matchingText.join('\n')
  }

  return {
    template_name: params.templateName,
    fields,
  }
}

function WebSelect(props: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  if (Platform.OS !== 'web') return null
  return React.createElement(
    'select',
    {
      value: props.value,
      onChange: (event: any) => props.onChange(String(event?.target?.value || '')),
      style: {
        width: '100%',
        height: 42,
        borderRadius: 10,
        border: '1px solid #d3d8e1',
        backgroundColor: '#ffffff',
        padding: '0 10px',
        fontSize: '14px',
      },
    },
    props.options.map((option) =>
      React.createElement('option', { key: option.value, value: option.value }, option.label),
    ),
  )
}

function WebAudioInput(props: { onPick: (file: File | null) => void }) {
  if (Platform.OS !== 'web') return null
  return React.createElement('input', {
    type: 'file',
    accept: 'audio/*',
    onChange: (event: any) => {
      const file = event?.target?.files?.[0] || null
      props.onPick(file)
    },
  })
}

function ActionButton(props: {
  onPress: () => void
  disabled?: boolean
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const variant = props.variant || 'primary'
  const textStyle =
    variant === 'secondary'
      ? styles.actionTextDark
      : styles.actionTextLight
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      style={[
        styles.actionButton,
        variant === 'primary' ? styles.actionPrimary : null,
        variant === 'secondary' ? styles.actionSecondary : null,
        variant === 'danger' ? styles.actionDanger : null,
        props.disabled ? styles.actionDisabled : null,
      ]}
    >
      <Text style={textStyle}>{props.label}</Text>
    </Pressable>
  )
}

export function AiLabScreen() {
  const [tool, setTool] = useState<ToolId>('transcription')

  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('batch')
  const [batchAudioFile, setBatchAudioFile] = useState<File | null>(null)
  const [isTranscribingBatch, setIsTranscribingBatch] = useState(false)
  const [realtimeSession, setRealtimeSession] = useState<RealtimeTranscriberSession | null>(null)
  const [isRealtimeRunning, setIsRealtimeRunning] = useState(false)
  const [isRealtimePaused, setIsRealtimePaused] = useState(false)
  const [isRealtimeBusy, setIsRealtimeBusy] = useState(false)
  const [transcriptionResult, setTranscriptionResult] = useState('')
  const [savedTranscriptions, setSavedTranscriptions] = useState<string[]>([])

  const [snippetSourceType, setSnippetSourceType] = useState<SnippetSourceType>('transcript')
  const [snippetInputMode, setSnippetInputMode] = useState<SnippetInputMode>('text')
  const [snippetInputText, setSnippetInputText] = useState('')
  const [snippetRealtimeSession, setSnippetRealtimeSession] = useState<RealtimeTranscriberSession | null>(null)
  const [isSnippetRealtimeRunning, setIsSnippetRealtimeRunning] = useState(false)
  const [isSnippetRealtimePaused, setIsSnippetRealtimePaused] = useState(false)
  const [isSnippetRealtimeBusy, setIsSnippetRealtimeBusy] = useState(false)
  const [snippetRawResponse, setSnippetRawResponse] = useState('')
  const [snippetDebugOutput, setSnippetDebugOutput] = useState('')
  const [snippetResult, setSnippetResult] = useState<Snippet[]>([])
  const [isSnippetRunning, setIsSnippetRunning] = useState(false)

  const [knowledgeBuildMode, setKnowledgeBuildMode] = useState<KnowledgeBuildMode>('create_snippets')
  const [manualSnippetInputs, setManualSnippetInputs] = useState<string[]>([''])
  const [knowledgeSnippetAccumulator, setKnowledgeSnippetAccumulator] = useState<Snippet[]>([])
  const [knowledgeResultJson, setKnowledgeResultJson] = useState('')
  const [isKnowledgeRunning, setIsKnowledgeRunning] = useState(false)

  const [reportType, setReportType] = useState<ReportType>('reintegratieplan_werkfit')
  const [reportResult, setReportResult] = useState('')
  const [reportSourcePreview, setReportSourcePreview] = useState('')
  const [isReportRunning, setIsReportRunning] = useState(false)
  const [isExportingUwv, setIsExportingUwv] = useState(false)

  const [exportWordTemplate, setExportWordTemplate] = useState<ExportWordTemplateId>('reintegratieplan_werkfit')
  const [exportWordValuesByTemplate, setExportWordValuesByTemplate] = useState<Record<ExportWordTemplateId, Record<string, string>>>({
    reintegratieplan_werkfit: {},
    eindrapportage_werkfit: {},
  })
  const [isExportWordRunning, setIsExportWordRunning] = useState(false)

  const [chatDraft, setChatDraft] = useState('')
  const [chatSystemPrompt, setChatSystemPrompt] = useState('')
  const [serverChatPolicyPrompt, setServerChatPolicyPrompt] = useState('')
  const [includeKnowledgeInChat, setIncludeKnowledgeInChat] = useState<'yes' | 'no'>('yes')
  const [includeSnippetResultsInChat, setIncludeSnippetResultsInChat] = useState<'yes' | 'no'>('yes')
  const [chatSnippetScope, setChatSnippetScope] = useState<ChatSnippetScope>('session')
  const [chatContextMessagesJson, setChatContextMessagesJson] = useState('[]')
  const [chatMessages, setChatMessages] = useState<LocalChatMessage[]>([])
  const [chatVisibleResponse, setChatVisibleResponse] = useState('')
  const [chatRawResponse, setChatRawResponse] = useState('')
  const [chatPromptPayloadPreview, setChatPromptPayloadPreview] = useState('[]')
  const [isChatRunning, setIsChatRunning] = useState(false)

  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [isCopyingSnapshot, setIsCopyingSnapshot] = useState(false)

  const resolvedSessionDate = nowMs()

  const selectedReportTemplate = useMemo(
    () => reportTypeOptions.find((item) => item.value === reportType) || reportTypeOptions[0],
    [reportType],
  )

  const selectedExportWordTemplate = useMemo(
    () => exportWordTemplateOptions.find((item) => item.value === exportWordTemplate) || exportWordTemplateOptions[0],
    [exportWordTemplate],
  )

  const exportWordFieldDefs = useMemo(
    () => allExportWordFields(exportWordTemplate),
    [exportWordTemplate],
  )

  const exportWordValues = useMemo(
    () => exportWordValuesByTemplate[exportWordTemplate] || {},
    [exportWordTemplate, exportWordValuesByTemplate],
  )

  const setOk = (message: string) => {
    setError('')
    setStatus(message)
  }

  const setFail = (reason: unknown) => {
    setStatus('')
    setError(reason instanceof Error ? reason.message : String(reason))
  }

  const ensureRealtimeEnabledForAiLab = async () => {
    const runtimeConfig = await fetchRealtimeTranscriptionRuntime()
    if (runtimeConfig.mode === 'azure-realtime-live') return

    try {
      // Provider is intentionally omitted here so the backend keeps the current runtime provider.
      await setAdminTranscriptionMode({ mode: 'azure-realtime-live' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('403') || message.toLowerCase().includes('forbidden')) {
        throw new Error(
          `Realtime transcription staat uit (mode=${runtimeConfig.mode}, provider=${runtimeConfig.provider}). Log in als admin of zet via Admin > Transcription mode op azure-realtime-live.`,
        )
      }
      throw error
    }

    const refreshedConfig = await fetchRealtimeTranscriptionRuntime()
    if (refreshedConfig.mode !== 'azure-realtime-live') {
      throw new Error(
        `Kon realtime transcription niet inschakelen (mode=${refreshedConfig.mode}, provider=${refreshedConfig.provider}).`,
      )
    }
  }

  useEffect(() => {
    if (snippetSourceType === 'written_recap') {
      setSnippetInputMode('text')
      if (snippetRealtimeSession) {
        void snippetRealtimeSession.stop().catch(() => {})
      }
      setSnippetRealtimeSession(null)
      setIsSnippetRealtimeRunning(false)
      setIsSnippetRealtimePaused(false)
      setIsSnippetRealtimeBusy(false)
    }
  }, [snippetSourceType, snippetRealtimeSession])

  useEffect(() => {
    if (snippetInputMode === 'text') {
      if (snippetRealtimeSession) {
        void snippetRealtimeSession.stop().catch(() => {})
      }
      setSnippetRealtimeSession(null)
      setIsSnippetRealtimeRunning(false)
      setIsSnippetRealtimePaused(false)
      setIsSnippetRealtimeBusy(false)
    }
  }, [snippetInputMode, snippetRealtimeSession])

  const addManualSnippetInput = () => {
    setManualSnippetInputs((current) => [...current, ''])
  }

  const removeManualSnippetInput = (index: number) => {
    setManualSnippetInputs((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index)
      return next.length > 0 ? next : ['']
    })
  }

  const updateManualSnippetInput = (index: number, value: string) => {
    setManualSnippetInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('ai_lab_saved_transcriptions')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      const values = parsed.filter((item) => typeof item === 'string') as string[]
      setSavedTranscriptions(values.slice(0, 10))
    } catch {}
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('ai_lab_saved_transcriptions', JSON.stringify(savedTranscriptions.slice(0, 10)))
    } catch {}
  }, [savedTranscriptions])

  useEffect(() => {
    let isCanceled = false
    if (chatSystemPrompt.trim()) return
    void (async () => {
      try {
        const prompt = await getServerChatPolicyPrompt()
        if (!isCanceled && prompt) {
          setServerChatPolicyPrompt(prompt)
          setChatSystemPrompt(prompt)
        }
      } catch {}
    })()
    return () => {
      isCanceled = true
    }
  }, [chatSystemPrompt])

  const saveCurrentTranscription = () => {
    const text = String(transcriptionResult || '').trim()
    if (!text) {
      setFail('No transcription result to save.')
      return
    }
    setSavedTranscriptions((current) => [text, ...current.slice(0, 9)])
    setOk('Transcription saved.')
  }

  const runBatchTranscription = async () => {
    try {
      setStatus('')
      setError('')
      setIsTranscribingBatch(true)
      if (!batchAudioFile) throw new Error('Upload an audio file first.')
      const transcript = await transcribeAudioFile({
        audioBlob: batchAudioFile,
        mimeType: batchAudioFile.type || 'audio/webm',
      })
      setTranscriptionResult(transcript)
      setOk('Batch transcription complete.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsTranscribingBatch(false)
    }
  }

  const startRealtime = async () => {
    try {
      setStatus('')
      setError('')
      setIsRealtimeBusy(true)
      await ensureRealtimeEnabledForAiLab()
      const session = await startRealtimeTranscription({
        onFinalSegment: ({ speaker, text }) => {
          setTranscriptionResult((current) => {
            const nextLine = `${speaker}: ${text}`.trim()
            if (!current.trim()) return nextLine
            return `${current}\n${nextLine}`
          })
        },
        onError: (message) => setFail(message),
      })
      setRealtimeSession(session)
      setIsRealtimeRunning(true)
      setIsRealtimePaused(false)
      setOk('Realtime transcription started.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsRealtimeBusy(false)
    }
  }

  const stopRealtime = async () => {
    try {
      setIsRealtimeBusy(true)
      await realtimeSession?.stop()
      setRealtimeSession(null)
      setIsRealtimeRunning(false)
      setIsRealtimePaused(false)
      setOk('Realtime transcription stopped.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsRealtimeBusy(false)
    }
  }

  const pauseRealtime = async () => {
    if (!isRealtimeRunning) return
    try {
      setIsRealtimeBusy(true)
      await realtimeSession?.stop()
      setRealtimeSession(null)
      setIsRealtimeRunning(false)
      setIsRealtimePaused(true)
      setOk('Realtime transcription paused.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsRealtimeBusy(false)
    }
  }

  const cancelRealtime = async () => {
    try {
      setIsRealtimeBusy(true)
      await realtimeSession?.stop()
    } catch {}
    setRealtimeSession(null)
    setIsRealtimeRunning(false)
    setIsRealtimePaused(false)
    setTranscriptionResult('')
    setOk('Realtime transcription canceled.')
    setIsRealtimeBusy(false)
  }

  const startSnippetRealtime = async () => {
    try {
      setStatus('')
      setError('')
      setIsSnippetRealtimeBusy(true)
      await ensureRealtimeEnabledForAiLab()
      const session = await startRealtimeTranscription({
        onFinalSegment: ({ speaker, text }) => {
          setSnippetInputText((current) => {
            const nextLine = `${speaker}: ${text}`.trim()
            if (!current.trim()) return nextLine
            return `${current}\n${nextLine}`
          })
        },
        onError: (message) => setFail(message),
      })
      setSnippetRealtimeSession(session)
      setIsSnippetRealtimeRunning(true)
      setIsSnippetRealtimePaused(false)
      setOk('Realtime snippet input started.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsSnippetRealtimeBusy(false)
    }
  }

  const stopSnippetRealtime = async () => {
    try {
      setIsSnippetRealtimeBusy(true)
      await snippetRealtimeSession?.stop()
      setSnippetRealtimeSession(null)
      setIsSnippetRealtimeRunning(false)
      setIsSnippetRealtimePaused(false)
      setOk('Realtime snippet input stopped.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsSnippetRealtimeBusy(false)
    }
  }

  const pauseSnippetRealtime = async () => {
    if (!isSnippetRealtimeRunning) return
    try {
      setIsSnippetRealtimeBusy(true)
      await snippetRealtimeSession?.stop()
      setSnippetRealtimeSession(null)
      setIsSnippetRealtimeRunning(false)
      setIsSnippetRealtimePaused(true)
      setOk('Realtime snippet input paused.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsSnippetRealtimeBusy(false)
    }
  }

  const cancelSnippetRealtime = async () => {
    try {
      setIsSnippetRealtimeBusy(true)
      await snippetRealtimeSession?.stop()
    } catch {}
    setSnippetRealtimeSession(null)
    setIsSnippetRealtimeRunning(false)
    setIsSnippetRealtimePaused(false)
    setSnippetInputText('')
    setOk('Realtime snippet input canceled.')
    setIsSnippetRealtimeBusy(false)
  }

  const runSnippetCreation = async (overrideText?: string): Promise<Snippet[]> => {
    const transcript = String(overrideText ?? snippetInputText ?? '').trim()
    if (!transcript) throw new Error('Input text is required.')
    const preview = await previewSnippetExtraction({
      sourceInputType: snippetSourceType,
      transcript,
    })
    const rawResponse = preview.debugChunks.map((chunk) => chunk.rawModelResponse).join('\n\n---\n\n')
    const debugOutput = preview.debugChunks
      .map((chunk) =>
        [
          `Chunk ${chunk.chunkIndex + 1}`,
          '',
          '[PROMPT]',
          chunk.promptUsed,
          '',
          '[RAW_MODEL_RESPONSE]',
          chunk.rawModelResponse,
          '',
          '[PARSED_SNIPPETS]',
          JSON.stringify(chunk.parsedSnippets, null, 2),
        ].join('\n'),
      )
      .join('\n\n====================\n\n')
    setSnippetRawResponse(rawResponse)
    setSnippetDebugOutput(debugOutput)
    const previewSnippets = preview.snippets.map((item, index) =>
      createSnippet({
        clientId: 'dev-client',
        sessionId: 'dev-session',
        field: item.field || `snippet_${index + 1}`,
        text: item.text,
        type: 'report',
      }),
    )
    setSnippetResult(previewSnippets)
    return previewSnippets
  }

  const runSnippetCreationButton = async () => {
    try {
      setStatus('')
      setError('')
      setIsSnippetRunning(true)
      await runSnippetCreation()
      setOk('Snippet creation complete.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsSnippetRunning(false)
    }
  }

  const runKnowledgeBuild = async () => {
    try {
      setStatus('')
      setError('')
      setIsKnowledgeRunning(true)

      let incomingSnippets: Snippet[] = []
      if (knowledgeBuildMode === 'create_snippets') {
        incomingSnippets = await runSnippetCreation()
      } else {
        incomingSnippets = manualSnippetInputs
          .map((text, index) => createSnippet({
            clientId: 'dev-client',
            sessionId: 'dev-session',
            field: `manual_${index + 1}`,
            text,
            type: 'knowledge',
          }))
          .filter((snippet) => snippet.text.length > 0)
      }

      const mergedSnippets = [...knowledgeSnippetAccumulator, ...incomingSnippets]
      setKnowledgeSnippetAccumulator(mergedSnippets)
      const knowledgePayload = {
        runs: mergedSnippets.length,
        snippetCount: mergedSnippets.length,
        snippets: mergedSnippets,
      }
      setKnowledgeResultJson(JSON.stringify(knowledgePayload, null, 2))
      setOk('Client knowledge updated.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsKnowledgeRunning(false)
    }
  }

  const resetKnowledgeBuild = () => {
    setKnowledgeSnippetAccumulator([])
    setKnowledgeResultJson('')
    setManualSnippetInputs([''])
    setOk('Client knowledge reset.')
  }

  const runCreateReport = async () => {
    try {
      setStatus('')
      setError('')
      setIsReportRunning(true)

      let workingSnippets = snippetResult
      if (workingSnippets.length === 0 && String(snippetInputText || '').trim()) {
        workingSnippets = await runSnippetCreation()
      }
      if (workingSnippets.length === 0) {
        throw new Error('Geen snippets beschikbaar. Draai eerst snippet creation.')
      }

      const inputBlock = buildReportInputFromSnippets({
        templateName: selectedReportTemplate.templateName,
        snippets: workingSnippets,
      })
      setReportSourcePreview(inputBlock)
      const report = await generateReportFromSource({
        sourceText: inputBlock,
        template: {
          name: selectedReportTemplate.templateName,
          sections: reportFieldMappingLines(selectedReportTemplate.templateName)
            .map(parseFieldMappingLine)
            .filter((item): item is { key: string; question: string } => item !== null)
            .map((item) => ({
              title: item.key,
              description: item.question,
            })),
        },
      })
      setReportResult(report)
      setOk('Report generated.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsReportRunning(false)
    }
  }

  const exportReportToUwv = async () => {
    try {
      setStatus('')
      setError('')
      setIsExportingUwv(true)
      const reportText = String(reportResult || '').trim()
      if (!reportText) throw new Error('No report to export.')
      const didExport = await exportUwvTemplateWord({
        templateName: selectedReportTemplate.templateName,
        reportText,
        contextValues: {},
      })
      if (!didExport) throw new Error('Selected report type does not map to a UWV export template.')
      setOk('UWV export started.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsExportingUwv(false)
    }
  }

  const runChat = async () => {
    try {
      setStatus('')
      setError('')
      setIsChatRunning(true)
      const message = String(chatDraft || '').trim()
      if (!message) throw new Error('Chat message is required.')
      const contextMessages = parseJsonArray<LocalChatMessage>(chatContextMessagesJson)
      const knowledgePayload = parseJsonObject(knowledgeResultJson || '{}') as { snippets?: Snippet[] }
      let knowledgeMessage: LocalChatMessage[] = []
      if (includeKnowledgeInChat === 'yes') {
        const snippets = Array.isArray(knowledgePayload?.snippets) ? knowledgePayload.snippets : []
        const knowledgeText = buildClientKnowledge(snippets)
        if (knowledgeText) {
          knowledgeMessage = [{ role: 'system', text: `Client knowledge:\n${knowledgeText}` }]
        }
      }
      const snippetMessages = includeSnippetResultsInChat === 'yes'
        ? buildSnippetSystemMessage({ snippets: snippetResult, scope: chatSnippetScope })
        : []
      const nextMessages: LocalChatMessage[] = [...chatMessages, { role: 'user', text: message }]
      const customSystemPrompt = String(chatSystemPrompt || '').trim()
      const defaultSystemPrompt = String(serverChatPolicyPrompt || '').trim()
      const includeCustomSystemPrompt = Boolean(customSystemPrompt) && customSystemPrompt !== defaultSystemPrompt
      const outboundMessages: LocalChatMessage[] = [
        ...(includeCustomSystemPrompt ? [{ role: 'system' as const, text: customSystemPrompt }] : []),
        ...knowledgeMessage,
        ...snippetMessages,
        ...contextMessages,
        ...nextMessages,
      ]
      const preview = await previewClientChatCompletion({ messages: outboundMessages, temperature: 0.2 })
      setChatMessages([...nextMessages, { role: 'assistant', text: preview.text }])
      setChatVisibleResponse(preview.text)
      setChatRawResponse(preview.rawResponse || preview.text)
      setChatPromptPayloadPreview(JSON.stringify(preview.messagesSentToModel, null, 2))
      setChatDraft('')
      setOk('Chat response received.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsChatRunning(false)
    }
  }

  const updateExportWordField = (key: string, value: string) => {
    setExportWordValuesByTemplate((current) => ({
      ...current,
      [exportWordTemplate]: {
        ...(current[exportWordTemplate] || {}),
        [key]: value,
      },
    }))
  }

  const resetExportWordFields = () => {
    setExportWordValuesByTemplate((current) => ({
      ...current,
      [exportWordTemplate]: {},
    }))
    setOk('Exportvelden gereset.')
  }

  const fillExportWordDefaults = () => {
    const today = new Date()
    const dateLabel = today.toISOString().slice(0, 10)
    const defaults: Record<string, string> = {}

    for (const field of exportWordFieldDefs) {
      if (field.key === '1_1_voorletters') defaults[field.key] = 'L.T.'
      else if (field.key === '1_1_achternaam') defaults[field.key] = 'Leijenhorst'
      else if (field.key === '1_2') defaults[field.key] = '123456782'
      else if (field.key === '3_1') defaults[field.key] = 'MKB Support'
      else if (field.key === '3_2') defaults[field.key] = 'St. Annastraat 198'
      else if (field.key === '3_3') defaults[field.key] = 'Postbus 123'
      else if (field.key === 'postadres_postcode') defaults[field.key] = '6541PR'
      else if (field.key === 'postadres_plaats') defaults[field.key] = 'Nijmegen'
      else if (field.key === '3_5') defaults[field.key] = 'L. Leijenhorst'
      else if (field.key === '3_6') defaults[field.key] = 'Re-integratiecoach'
      else if (field.key === '3_7') defaults[field.key] = '0612345678'
      else if (field.key === '3_8') defaults[field.key] = 'lt@example.com'
      else if (field.key === '4_1') defaults[field.key] = 'ORD-2026-001'
      else if (field.key === '5_3') defaults[field.key] = 'Netwerkanalyse (2 uur); CV-optimalisatie (3 uur); Sollicitatietraining (4 uur)'
      else if (field.key === '8_2_aantal_uren') defaults[field.key] = '2'
      else if (field.key === '8_2_motivering') defaults[field.key] = 'Specialistische inzet nodig voor arbeidsmarktanalyse en positionering.'
      else if (field.key === '8_3a') defaults[field.key] = '95'
      else if (field.key === '8_3b') defaults[field.key] = 'Tarief sluit aan op specialistische expertise en marktconforme inzet.'
      else if (field.key === '10_ondertekening_contactpersoon_re_integratiebedrijf_naam') defaults[field.key] = 'L. Leijenhorst'
      else if (field.key === '10_ondertekening_client_naam') defaults[field.key] = 'L.T. Leijenhorst'
      else if (field.key === '9_ondertekening_contactpersoon_re_integratiebedrijf_naam') defaults[field.key] = 'L. Leijenhorst'
      else if (field.key === '9_ondertekening_client_naam') defaults[field.key] = 'L.T. Leijenhorst'
      else if (field.key.startsWith('rp_werkfit_')) defaults[field.key] = `Testantwoord ${field.key} (${dateLabel}).`
      else if (field.key.startsWith('er_werkfit_')) defaults[field.key] = `Testantwoord ${field.key} (${dateLabel}).`
      else defaults[field.key] = `Testwaarde ${field.key}`
    }

    setExportWordValuesByTemplate((current) => ({
      ...current,
      [exportWordTemplate]: defaults,
    }))
    setOk('Standaard testwaarden ingevuld.')
  }

  const runExportWord = async () => {
    try {
      setStatus('')
      setError('')
      setIsExportWordRunning(true)

      const reportFieldKeys = new Set(exportWordReportFields(exportWordTemplate).map((field) => field.key))
      const contextValues: Record<string, string> = {}
      const jsonFields: Record<string, string> = {}

      for (const [key, rawValue] of Object.entries(exportWordValues)) {
        const value = String(rawValue || '').trim()
        if (!value) continue
        if (reportFieldKeys.has(key)) {
          jsonFields[key] = value
          continue
        }
        contextValues[key] = value
      }

      const reportText = JSON.stringify(
        {
          template_name: selectedExportWordTemplate.templateName,
          fields: jsonFields,
        },
        null,
        2,
      )

      const didExport = await exportUwvTemplateWord({
        templateName: selectedExportWordTemplate.templateName,
        reportText,
        contextValues,
      })
      if (!didExport) throw new Error('Kon Word-template niet bepalen voor dit verslag.')
      setOk('Word export gestart.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsExportWordRunning(false)
    }
  }

  const loadClientChatScenario = () => {
    const contextMessages = buildRealisticClientChatContextMessages()
    setChatContextMessagesJson(JSON.stringify(contextMessages, null, 2))
    setKnowledgeResultJson(
      JSON.stringify(
        {
          snippets: [
            createSnippet({
              clientId: 'dev-client',
              sessionId: 'sessie-week-4',
              field: 'general',
              text: 'Client heeft baat bij vaste weekstructuur en check-ins.',
              type: 'knowledge',
            }),
          ],
        },
        null,
        2,
      ),
    )
    setIncludeKnowledgeInChat('yes')
    setChatSnippetScope('client')
    setChatDraft('Welke voortgang is zichtbaar en wat lijkt nu de grootste belemmering?')
    setOk('Realistic client chat scenario loaded.')
  }

  const loadSessionChatScenario = () => {
    const contextMessages = buildRealisticSessionChatContextMessages()
    setChatContextMessagesJson(JSON.stringify(contextMessages, null, 2))
    setIncludeKnowledgeInChat('no')
    setChatSnippetScope('session')
    setChatDraft('Welke concrete voortgang noemt de cliÃ«nt en welke belemmering blijft bestaan?')
    setOk('Realistic session chat scenario loaded.')
  }

  const buildSnapshotText = (): string => {
    if (tool === 'snippet-creation') {
      return [
        'Type:',
        snippetSourceType,
        '',
        'Input:',
        snippetInputText,
        '',
        'Raw AI response:',
        snippetRawResponse,
      ].join('\n')
    }

    const sections: string[] = []
    sections.push('[AI_LAB_STATE]')
    sections.push(`tool=${tool}`)
    sections.push(`transcriptionMode=${transcriptionMode}`)
    sections.push(`snippetSourceType=${snippetSourceType}`)
    sections.push(`knowledgeBuildMode=${knowledgeBuildMode}`)
    sections.push(`reportType=${reportType}`)
    sections.push('')
    sections.push('[INPUT_TRANSCRIPTION]')
    sections.push(`batchAudioFile=${batchAudioFile ? batchAudioFile.name : ''}`)
    sections.push('')
    sections.push('[INPUT_SNIPPET]')
    sections.push(`snippetSourceType=${snippetSourceType}`)
    sections.push(snippetInputText)
    sections.push('')
    sections.push('[INPUT_KNOWLEDGE_MANUAL_SNIPPETS]')
    sections.push(JSON.stringify(manualSnippetInputs, null, 2))
    sections.push('')
    sections.push('[INPUT_REPORT]')
    sections.push(`template=${selectedReportTemplate.templateName}`)
    sections.push('')
    sections.push('[INPUT_EXPORT_WORD]')
    sections.push(`template=${selectedExportWordTemplate.templateName}`)
    sections.push(JSON.stringify(exportWordValues, null, 2))
    sections.push('')
    sections.push('[INPUT_CHAT]')
    sections.push('chatDraft=')
    sections.push(chatDraft)
    sections.push('chatSystemPrompt=')
    sections.push(chatSystemPrompt)
    sections.push('chatContextMessagesJson=')
    sections.push(chatContextMessagesJson)
    sections.push('includeKnowledgeInChat=')
    sections.push(includeKnowledgeInChat)
    sections.push('includeSnippetResultsInChat=')
    sections.push(includeSnippetResultsInChat)
    sections.push('chatSnippetScope=')
    sections.push(chatSnippetScope)
    sections.push('')
    sections.push('[OUTPUT_TRANSCRIPTION]')
    sections.push(transcriptionResult)
    sections.push('')
    sections.push('[OUTPUT_SNIPPETS]')
    sections.push(JSON.stringify(snippetResult, null, 2))
    sections.push('')
    sections.push('[OUTPUT_SNIPPET_RAW_RESPONSE]')
    sections.push(snippetRawResponse)
    sections.push('')
    sections.push('[OUTPUT_SNIPPET_DEBUG]')
    sections.push(snippetDebugOutput)
    sections.push('')
    sections.push('[OUTPUT_KNOWLEDGE]')
    sections.push(knowledgeResultJson)
    sections.push('')
    sections.push('[OUTPUT_REPORT_SOURCE_PREVIEW]')
    sections.push(reportSourcePreview)
    sections.push('')
    sections.push('[OUTPUT_REPORT]')
    sections.push(reportResult)
    sections.push('')
    sections.push('[OUTPUT_CHAT]')
    sections.push(JSON.stringify(chatMessages, null, 2))
    sections.push('')
    sections.push('[OUTPUT_CHAT_VISIBLE_RESPONSE]')
    sections.push(chatVisibleResponse)
    sections.push('')
    sections.push('[OUTPUT_CHAT_RAW_RESPONSE]')
    sections.push(chatRawResponse)
    sections.push('')
    sections.push('[OUTPUT_CHAT_PROMPT_PAYLOAD]')
    sections.push(chatPromptPayloadPreview)
    sections.push('')
    sections.push('[STATUS]')
    sections.push(status)
    sections.push('')
    sections.push('[ERROR]')
    sections.push(error)
    return sections.join('\n')
  }

  const copySnapshot = async () => {
    try {
      setStatus('')
      setError('')
      setIsCopyingSnapshot(true)
      const snapshot = buildSnapshotText()
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is not available in this environment.')
      }
      await navigator.clipboard.writeText(snapshot)
      setOk('AI Lab input/output copied to clipboard.')
    } catch (reason) {
      setFail(reason)
    } finally {
      setIsCopyingSnapshot(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.title}>AI Lab</Text>

      <View style={styles.panel}>
        <Text style={styles.label}>Tool</Text>
        <WebSelect value={tool} onChange={(value) => setTool(value as ToolId)} options={toolOptions} />
      </View>

      {tool === 'transcription' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Transcription</Text>
          <Text style={styles.label}>Mode</Text>
          <WebSelect
            value={transcriptionMode}
            onChange={(value) => setTranscriptionMode(value as TranscriptionMode)}
            options={[
              { value: 'batch', label: 'Batch' },
              { value: 'realtime', label: 'Realtime' },
            ]}
          />

          {transcriptionMode === 'batch' ? (
            <>
              <Text style={styles.label}>Upload file</Text>
              <WebAudioInput onPick={setBatchAudioFile} />
              <Text style={styles.meta}>{batchAudioFile ? `Selected: ${batchAudioFile.name}` : 'No audio selected.'}</Text>
              <View style={styles.row}>
                <ActionButton
                  onPress={runBatchTranscription}
                  disabled={isTranscribingBatch}
                  label={buttonLabel(isTranscribingBatch, 'Run batch', 'Running...')}
                />
                <ActionButton
                  onPress={saveCurrentTranscription}
                  disabled={isTranscribingBatch}
                  label="Save"
                  variant="secondary"
                />
              </View>
            </>
          ) : (
            <>
              <View style={styles.row}>
                <ActionButton
                  onPress={startRealtime}
                  disabled={isRealtimeBusy || isRealtimeRunning}
                  label={isRealtimePaused ? 'Resume' : 'Start'}
                />
                <ActionButton
                  onPress={stopRealtime}
                  disabled={isRealtimeBusy || !isRealtimeRunning}
                  label="Stop"
                  variant="secondary"
                />
                <ActionButton
                  onPress={pauseRealtime}
                  disabled={isRealtimeBusy || !isRealtimeRunning}
                  label="Pause"
                  variant="secondary"
                />
                <ActionButton
                  onPress={cancelRealtime}
                  disabled={isRealtimeBusy || (!isRealtimeRunning && !isRealtimePaused)}
                  label="Cancel"
                  variant="danger"
                />
                <ActionButton
                  onPress={saveCurrentTranscription}
                  disabled={isRealtimeBusy}
                  label="Save"
                  variant="secondary"
                />
              </View>
            </>
          )}

          <Text style={styles.label}>Result</Text>
          <TextInput
            style={[styles.input, styles.largeInput]}
            multiline
            value={transcriptionResult}
            onChangeText={setTranscriptionResult}
            placeholder="Transcription result"
            placeholderTextColor="#8b95a7"
          />
          {savedTranscriptions.length > 0 ? (
            <>
              <Text style={styles.label}>Saved results</Text>
              <TextInput style={[styles.input, styles.mediumInput]} multiline editable={false} value={savedTranscriptions.join('\n\n---\n\n')} />
            </>
          ) : null}
        </View>
      ) : null}

      {(tool === 'snippet-creation' || tool === 'client-knowledge-build' || tool === 'create-report') ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Snippet creation</Text>
          <Text style={styles.label}>Type</Text>
          <WebSelect
            value={snippetSourceType}
            onChange={(value) => setSnippetSourceType(value as SnippetSourceType)}
            options={[
              { value: 'transcript', label: 'Transcript' },
              { value: 'spoken_recap', label: 'Spoken recap' },
              { value: 'written_recap', label: 'Written recap' },
            ]}
          />
          {snippetSourceType !== 'written_recap' ? (
            <>
              <Text style={styles.label}>Input mode</Text>
              <WebSelect
                value={snippetInputMode}
                onChange={(value) => setSnippetInputMode(value as SnippetInputMode)}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'realtime', label: 'Realtime speech' },
                ]}
              />
              {snippetInputMode === 'realtime' ? (
                <View style={styles.row}>
                  <ActionButton
                    onPress={startSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || isSnippetRealtimeRunning}
                    label={isSnippetRealtimePaused ? 'Resume' : 'Start'}
                  />
                  <ActionButton
                    onPress={stopSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || !isSnippetRealtimeRunning}
                    label="Stop"
                    variant="secondary"
                  />
                  <ActionButton
                    onPress={pauseSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || !isSnippetRealtimeRunning}
                    label="Pause"
                    variant="secondary"
                  />
                  <ActionButton
                    onPress={cancelSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || (!isSnippetRealtimeRunning && !isSnippetRealtimePaused)}
                    label="Cancel"
                    variant="danger"
                  />
                </View>
              ) : null}
            </>
          ) : null}
          <Text style={styles.label}>Input</Text>
          <TextInput
            style={[styles.input, styles.largeInput]}
            multiline
            value={snippetInputText}
            onChangeText={setSnippetInputText}
            placeholder="Paste transcript or written recap."
            placeholderTextColor="#8b95a7"
          />
          <ActionButton
            onPress={runSnippetCreationButton}
            disabled={isSnippetRunning}
            label={buttonLabel(isSnippetRunning, 'Run', 'Running...')}
          />
          <Text style={styles.label}>Result</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={JSON.stringify(snippetResult, null, 2)} />
          <Text style={styles.label}>Raw AI response</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={snippetRawResponse} />
          <Text style={styles.label}>Chunk debug</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={snippetDebugOutput} />
        </View>
      ) : null}

      {tool === 'client-knowledge-build' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Client knowledge build</Text>
          <Text style={styles.meta}>No AI step. This just packages approved snippets into reusable chat context.</Text>
          <Text style={styles.label}>Mode</Text>
          <WebSelect
            value={knowledgeBuildMode}
            onChange={(value) => setKnowledgeBuildMode(value as KnowledgeBuildMode)}
            options={[
              { value: 'create_snippets', label: 'Create snippets' },
              { value: 'add_snippets', label: 'Add snippets' },
            ]}
          />

          {knowledgeBuildMode === 'add_snippets' ? (
            <>
              {manualSnippetInputs.map((input, index) => (
                <View key={`manual-snippet-${index}`} style={styles.manualSnippetRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    value={input}
                    onChangeText={(value) => updateManualSnippetInput(index, value)}
                    placeholder={`Snippet ${index + 1}`}
                    placeholderTextColor="#8b95a7"
                  />
                  <ActionButton onPress={addManualSnippetInput} label="+" variant="secondary" />
                  <ActionButton onPress={() => removeManualSnippetInput(index)} label="-" variant="danger" />
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.meta}>Uses the snippet creation section above.</Text>
          )}

          <View style={styles.row}>
            <ActionButton
              onPress={runKnowledgeBuild}
              disabled={isKnowledgeRunning}
              label={buttonLabel(isKnowledgeRunning, 'Run', 'Running...')}
            />
            <ActionButton onPress={resetKnowledgeBuild} disabled={isKnowledgeRunning} label="Reset" variant="secondary" />
          </View>

          <Text style={styles.label}>Result (JSON)</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={knowledgeResultJson} />
        </View>
      ) : null}

      {tool === 'create-report' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Create report</Text>
          <Text style={styles.meta}>Uses snippets from the snippet creation output.</Text>
          <Text style={styles.label}>Report type</Text>
          <WebSelect
            value={reportType}
            onChange={(value) => setReportType(value as ReportType)}
            options={reportTypeOptions.map((item) => ({ value: item.value, label: item.label }))}
          />
          <View style={styles.row}>
            <ActionButton
              onPress={runCreateReport}
              disabled={isReportRunning}
              label={buttonLabel(isReportRunning, 'Run', 'Running...')}
            />
            <ActionButton
              onPress={exportReportToUwv}
              disabled={isExportingUwv || isReportRunning}
              label={buttonLabel(isExportingUwv, 'Export UWV', 'Exporting...')}
              variant="secondary"
            />
          </View>
          <Text style={styles.label}>Source preview</Text>
          <TextInput style={[styles.input, styles.mediumInput]} multiline editable={false} value={reportSourcePreview} />
          <Text style={styles.label}>Output</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline value={reportResult} onChangeText={setReportResult} />
        </View>
      ) : null}

      {tool === 'export-word' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Export to Word</Text>
          <Text style={styles.meta}>Test UWV Word export with direct field input.</Text>
          <Text style={styles.label}>Verslag</Text>
          <WebSelect
            value={exportWordTemplate}
            onChange={(value) => setExportWordTemplate(value as ExportWordTemplateId)}
            options={exportWordTemplateOptions.map((item) => ({ value: item.value, label: item.label }))}
          />
          <Text style={styles.label}>Velden</Text>
          {exportWordFieldDefs.map((field) => (
            <View key={`export-word-field-${field.key}`} style={styles.panelSubsection}>
              <Text style={styles.meta}>{field.label}</Text>
              <TextInput
                style={[styles.input, field.multiline ? styles.mediumInput : null]}
                multiline={field.multiline === true}
                value={String(exportWordValues[field.key] || '')}
                onChangeText={(value) => updateExportWordField(field.key, value)}
                placeholder={field.key}
                placeholderTextColor="#8b95a7"
              />
            </View>
          ))}
          <View style={styles.row}>
            <ActionButton
              onPress={runExportWord}
              disabled={isExportWordRunning}
              label={buttonLabel(isExportWordRunning, 'Export to Word', 'Exporting...')}
            />
            <ActionButton
              onPress={fillExportWordDefaults}
              disabled={isExportWordRunning}
              label="Autofill defaults"
              variant="secondary"
            />
            <ActionButton
              onPress={resetExportWordFields}
              disabled={isExportWordRunning}
              label="Reset"
              variant="secondary"
            />
          </View>
        </View>
      ) : null}

      {tool === 'chat-messaging' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Chat messaging</Text>
          <View style={styles.row}>
            <ActionButton onPress={loadClientChatScenario} label="Load client scenario" variant="secondary" />
            <ActionButton onPress={loadSessionChatScenario} label="Load session scenario" variant="secondary" />
          </View>
          <View style={styles.chatLayout}>
            <View style={styles.chatColumn}>
              <Text style={styles.label}>Conversation</Text>
              <ScrollView style={styles.chatHistory}>
                {chatMessages.map((message, index) => (
                  <View key={`chat-msg-${index}`} style={styles.chatMessageCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.meta}>{message.role}</Text>
                      <ActionButton
                        onPress={() => setChatMessages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        label="Delete"
                        variant="danger"
                      />
                    </View>
                    <Text style={styles.chatMessageText}>{message.text}</Text>
                  </View>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.input, styles.chatDraftInput]}
                multiline
                value={chatDraft}
                onChangeText={setChatDraft}
                placeholder="Ask your AI question."
                placeholderTextColor="#8b95a7"
              />
              <ActionButton
                onPress={runChat}
                disabled={isChatRunning}
                label={buttonLabel(isChatRunning, 'Send', 'Sending...')}
              />
              <Text style={styles.label}>Visible response</Text>
              <TextInput style={[styles.input, styles.mediumInput]} multiline editable={false} value={chatVisibleResponse} />
              <Text style={styles.label}>Raw response</Text>
              <TextInput style={[styles.input, styles.mediumInput]} multiline editable={false} value={chatRawResponse} />
            </View>
            <View style={styles.chatColumn}>
              <Text style={styles.label}>System prompt (editable)</Text>
              <TextInput
                style={[styles.input, styles.mediumInput]}
                multiline
                value={chatSystemPrompt}
                onChangeText={setChatSystemPrompt}
                placeholder="Optional extra system prompt."
                placeholderTextColor="#8b95a7"
              />
              <Text style={styles.label}>Use built client knowledge</Text>
              <WebSelect
                value={includeKnowledgeInChat}
                onChange={(value) => setIncludeKnowledgeInChat(value as 'yes' | 'no')}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
              <Text style={styles.label}>Use snippet creation output</Text>
              <WebSelect
                value={includeSnippetResultsInChat}
                onChange={(value) => setIncludeSnippetResultsInChat(value as 'yes' | 'no')}
                options={[
                  { value: 'yes', label: 'Yes' },
                  { value: 'no', label: 'No' },
                ]}
              />
              <Text style={styles.label}>Snippet scope</Text>
              <WebSelect
                value={chatSnippetScope}
                onChange={(value) => setChatSnippetScope(value as ChatSnippetScope)}
                options={[
                  { value: 'session', label: 'Session chatbot' },
                  { value: 'client', label: 'Client chatbot' },
                ]}
              />
              <Text style={styles.label}>Context messages (JSON array)</Text>
              <TextInput
                style={[styles.input, styles.mediumInput]}
                multiline
                value={chatContextMessagesJson}
                onChangeText={setChatContextMessagesJson}
                placeholder='[{"role":"system","text":"..."}]'
                placeholderTextColor="#8b95a7"
              />
              <Text style={styles.label}>Full prompt sent to AI</Text>
              <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={chatPromptPayloadPreview} />
            </View>
          </View>
        </View>
      ) : null}

      {tool === 'chat-messaging' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Snippet creation (chat context)</Text>
          <Text style={styles.label}>Type</Text>
          <WebSelect
            value={snippetSourceType}
            onChange={(value) => setSnippetSourceType(value as SnippetSourceType)}
            options={[
              { value: 'transcript', label: 'Transcript' },
              { value: 'spoken_recap', label: 'Spoken recap' },
              { value: 'written_recap', label: 'Written recap' },
            ]}
          />
          {snippetSourceType !== 'written_recap' ? (
            <>
              <Text style={styles.label}>Input mode</Text>
              <WebSelect
                value={snippetInputMode}
                onChange={(value) => setSnippetInputMode(value as SnippetInputMode)}
                options={[
                  { value: 'text', label: 'Text' },
                  { value: 'realtime', label: 'Realtime speech' },
                ]}
              />
              {snippetInputMode === 'realtime' ? (
                <View style={styles.row}>
                  <ActionButton
                    onPress={startSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || isSnippetRealtimeRunning}
                    label={isSnippetRealtimePaused ? 'Resume' : 'Start'}
                  />
                  <ActionButton
                    onPress={stopSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || !isSnippetRealtimeRunning}
                    label="Stop"
                    variant="secondary"
                  />
                  <ActionButton
                    onPress={pauseSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || !isSnippetRealtimeRunning}
                    label="Pause"
                    variant="secondary"
                  />
                  <ActionButton
                    onPress={cancelSnippetRealtime}
                    disabled={isSnippetRealtimeBusy || (!isSnippetRealtimeRunning && !isSnippetRealtimePaused)}
                    label="Cancel"
                    variant="danger"
                  />
                </View>
              ) : null}
            </>
          ) : null}
          <Text style={styles.label}>Input</Text>
          <TextInput
            style={[styles.input, styles.largeInput]}
            multiline
            value={snippetInputText}
            onChangeText={setSnippetInputText}
            placeholder="Paste transcript or written recap."
            placeholderTextColor="#8b95a7"
          />
          <ActionButton
            onPress={runSnippetCreationButton}
            disabled={isSnippetRunning}
            label={buttonLabel(isSnippetRunning, 'Run', 'Running...')}
          />
          <Text style={styles.label}>Result</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={JSON.stringify(snippetResult, null, 2)} />
          <Text style={styles.label}>Raw AI response</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={snippetRawResponse} />
        </View>
      ) : null}

      {tool === 'chat-messaging' ? (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Client knowledge build (chat context)</Text>
          <Text style={styles.label}>Mode</Text>
          <WebSelect
            value={knowledgeBuildMode}
            onChange={(value) => setKnowledgeBuildMode(value as KnowledgeBuildMode)}
            options={[
              { value: 'create_snippets', label: 'Create snippets' },
              { value: 'add_snippets', label: 'Add snippets' },
            ]}
          />

          {knowledgeBuildMode === 'add_snippets' ? (
            <>
              {manualSnippetInputs.map((input, index) => (
                <View key={`manual-snippet-chat-${index}`} style={styles.manualSnippetRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    value={input}
                    onChangeText={(value) => updateManualSnippetInput(index, value)}
                    placeholder={`Snippet ${index + 1}`}
                    placeholderTextColor="#8b95a7"
                  />
                  <ActionButton onPress={addManualSnippetInput} label="+" variant="secondary" />
                  <ActionButton onPress={() => removeManualSnippetInput(index)} label="-" variant="danger" />
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.meta}>Uses the snippet creation section above.</Text>
          )}

          <View style={styles.row}>
            <ActionButton
              onPress={runKnowledgeBuild}
              disabled={isKnowledgeRunning}
              label={buttonLabel(isKnowledgeRunning, 'Run', 'Running...')}
            />
            <ActionButton onPress={resetKnowledgeBuild} disabled={isKnowledgeRunning} label="Reset" variant="secondary" />
          </View>

          <Text style={styles.label}>Result (JSON)</Text>
          <TextInput style={[styles.input, styles.largeInput]} multiline editable={false} value={knowledgeResultJson} />
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.sectionTitle}>Share</Text>
        <Text style={styles.meta}>Copy all current input and output values from this page.</Text>
        <ActionButton
          onPress={copySnapshot}
          disabled={isCopyingSnapshot}
          label={buttonLabel(isCopyingSnapshot, 'Copy AI Lab I/O', 'Copying...')}
        />
      </View>

      {status ? <Text style={styles.ok}>{status}</Text> : null}
      {error ? <Text style={styles.fail}>{error}</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    gap: 14,
    backgroundColor: '#edf1f7',
  },
  panel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d2d9e3',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  panelSubsection: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  meta: {
    fontSize: 12,
    color: '#64748b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d3d8e1',
    borderRadius: 10,
    backgroundColor: '#fbfcfe',
    paddingHorizontal: 10,
    paddingVertical: 10,
    color: '#0f172a',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    minWidth: 120,
    height: 38,
    borderRadius: 9,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionPrimary: {
    borderColor: '#1f5fd6',
    backgroundColor: '#1f5fd6',
  },
  actionSecondary: {
    borderColor: '#bcc7d8',
    backgroundColor: '#f4f7fc',
  },
  actionDanger: {
    borderColor: '#cf3b3b',
    backgroundColor: '#cf3b3b',
  },
  actionDisabled: {
    opacity: 0.6,
  },
  actionTextLight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionTextDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b2a42',
  },
  largeInput: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  mediumInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  manualSnippetRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  flexInput: {
    flex: 1,
  },
  chatLayout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-start',
  },
  chatColumn: {
    flexGrow: 1,
    flexBasis: 420,
    gap: 8,
  },
  chatHistory: {
    maxHeight: 320,
    borderWidth: 1,
    borderColor: '#d3d8e1',
    borderRadius: 10,
    backgroundColor: '#fbfcfe',
    padding: 8,
  },
  chatMessageCard: {
    borderWidth: 1,
    borderColor: '#dbe2ee',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 8,
    marginBottom: 8,
    gap: 6,
  },
  chatMessageText: {
    fontSize: 14,
    color: '#0f172a',
  },
  chatDraftInput: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  ok: {
    color: '#146c2e',
    fontSize: 13,
    fontWeight: '700',
  },
  fail: {
    color: '#b00020',
    fontSize: 13,
    fontWeight: '700',
  },
})

