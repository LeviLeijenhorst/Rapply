import { useCallback, useMemo, useRef, useState } from 'react'
import type { ScrollView, TextInput } from 'react-native'
import { useWindowDimensions } from 'react-native'

import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import { isSessionReportArtifact } from '@/types/sessionArtifacts'

import type {
  DashboardContinueItem,
  DashboardOpenActionItem,
  DashboardQuickInputAction,
  DashboardScreenModel,
  DashboardScreenProps,
  DashboardStatCardData,
  QuickInputIconKey,
} from './DashboardScreen.types'

function parseJsonObject(value: string | null | undefined): Record<string, unknown> | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function pickProfilePhotoUri(clientDetails: string): string | null {
  const parsed = parseJsonObject(clientDetails)
  if (!parsed) return null

  const candidateKeys = [
    'profilePhotoDataUrl',
    'photoDataUrl',
    'avatarDataUrl',
    'profilePhotoUrl',
    'photoUrl',
    'avatarUrl',
    'imageUrl',
    'image',
  ] as const

  for (const key of candidateKeys) {
    const candidate = readString(parsed[key])
    if (candidate) return candidate
  }

  return null
}

function formatContinueSubtitle(kind: string, title: string): string {
  if (kind === 'written') return `Rapportage bewerken - ${title}`
  if (kind === 'notes') return `Notities - ${title}`
  return `Sessie - ${title}`
}

function normalizeSessionLikeId(id: string): string {
  const raw = String(id || '').trim().toLowerCase()
  if (!raw) return ''
  if (raw.startsWith('session-')) return raw.slice('session-'.length)
  if (raw.startsWith('item-')) return raw.slice('item-'.length)
  return raw
}

function toRelativeDateLabel(valueUnixMs: number): string {
  const now = Date.now()
  const diffMs = Math.max(0, now - valueUnixMs)
  const dayMs = 24 * 60 * 60 * 1000
  const diffDays = Math.floor(diffMs / dayMs)
  if (diffDays <= 0) return 'Vandaag'
  if (diffDays === 1) return '1 dag geleden'
  if (diffDays < 7) return `${diffDays} dagen geleden`
  if (diffDays < 14) return '1 week geleden'
  if (diffDays < 31) return `${Math.floor(diffDays / 7)} weken geleden`
  if (diffDays < 61) return '1 maand geleden'
  return `${Math.floor(diffDays / 30)} maanden geleden`
}

function toDateLabel(valueUnixMs: number): string {
  return new Date(valueUnixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getQuickInputActions(onOpenRecord: DashboardScreenProps['onOpenRecord']): DashboardQuickInputAction[] {
  const create = (
    id: string,
    iconKey: QuickInputIconKey,
    title: string,
    subtitle: string,
    accentFrom: string,
    accentTo: string,
  ): DashboardQuickInputAction => ({
    id,
    iconKey,
    title,
    subtitle,
    accentFrom,
    accentTo,
    onPress: onOpenRecord,
  })

  return [
    create('record-session', 'record-session', 'Record sessie', 'Neem een volledige sessie op', '#6E22B7', '#8E32E8'),
    create('record-summary', 'record-summary', 'Record samenvatting', 'Maak een spraakopname over een sessie', '#1B4EC2', '#2A6DFF'),
    create('record-video', 'record-video', 'Record video call', 'Open de Colibra desktop-app', '#0F7E3A', '#1CB95C'),
    create('import-audio', 'import-audio', 'Importeer audio', 'Selecteer een audio file van je computer', '#C75D10', '#F1852F'),
    create('import-document', 'import-document', 'Importeer document', 'Selecteer een document van je computer', '#9C0154', '#D51477'),
  ]
}

export function useDashboardScreenModel(props: DashboardScreenProps): DashboardScreenModel {
  const { width } = useWindowDimensions()
  const { data } = useLocalAppData()

  const [openActionQuery, setOpenActionQuery] = useState('')
  const scrollRef = useRef<ScrollView | null>(null)
  const openActionsOffsetYRef = useRef(0)
  const openActionInputRef = useRef<TextInput | null>(null)

  const isStacked = width < 1180

  const scrollToOpenActions = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, openActionsOffsetYRef.current - 8),
      animated: true,
    })
  }, [])

  const setOpenActionsOffsetY = useCallback((value: number) => {
    openActionsOffsetYRef.current = value
  }, [])

  const clientById = useMemo(
    () =>
      new Map(
        data.coachees.map((coachee) => [
          coachee.id,
          {
            name: String(coachee.name || '').trim() || 'Onbekende client',
            profilePhotoUri: pickProfilePhotoUri(coachee.clientDetails),
          },
        ]),
      ),
    [data.coachees],
  )

  const sessionByLookupKey = useMemo(() => {
    const map = new Map<string, (typeof data.sessions)[number]>()

    for (const session of data.sessions) {
      const raw = String(session.id || '').trim()
      if (!raw) continue

      map.set(raw, session)

      const normalized = normalizeSessionLikeId(raw)
      if (normalized) {
        map.set(normalized, session)

        const compact = normalized.replace(/[^a-z0-9]/g, '')
        if (compact) map.set(compact, session)
      }
    }

    return map
  }, [data.sessions])

  const quickInputActions = useMemo(() => getQuickInputActions(props.onOpenRecord), [props.onOpenRecord])

  const continueItems = useMemo<DashboardContinueItem[]>(
    () =>
      [...data.sessions]
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
        .filter((session) => !!session.coacheeId)
        .slice(0, 5)
        .map((session) => {
          const client = session.coacheeId ? clientById.get(session.coacheeId) : null
          const title = String(session.title || '').trim() || 'Naamloze sessie'
          return {
            id: session.id,
            clientId: session.coacheeId || '',
            clientName: client?.name || 'Onbekende client',
            subtitle: formatContinueSubtitle(session.kind, title),
            profilePhotoUri: client?.profilePhotoUri || null,
          }
        }),
    [clientById, data.sessions],
  )

  const openActionItems = useMemo<DashboardOpenActionItem[]>(() => {
    const writtenBySessionId = new Map(data.writtenReports.map((report) => [report.sessionId, report]))

    const reportItems: DashboardOpenActionItem[] = data.sessions
      .filter((session) => isSessionReportArtifact(session))
      .filter((session) => {
        const reportText = writtenBySessionId.get(session.id)?.text ?? ''
        return reportText.trim().length === 0
      })
      .map((session) => {
        const client = session.coacheeId ? clientById.get(session.coacheeId) : null
        const title = String(session.title || '').trim() || 'Rapportage'
        return {
          id: `report-${session.id}`,
          kind: 'report',
          itemLabel: `Rapportage: ${title}`,
          statusLabel: 'Controleren',
          clientId: session.coacheeId ?? null,
          clientName: client?.name || 'Zonder client',
          sessionId: session.id,
          createdAtLabel: toDateLabel(session.createdAtUnixMs),
          createdAtUnixMs: session.createdAtUnixMs,
          updatedLabel: toRelativeDateLabel(session.updatedAtUnixMs),
          updatedAtUnixMs: session.updatedAtUnixMs,
        }
      })

    const groupedSnippetItems = new Map<string, DashboardOpenActionItem & { pendingCount: number }>()

    for (const snippet of data.snippets) {
      if (snippet.status !== 'pending') continue

      const rawItemId = String(snippet.itemId || '').trim()
      const normalizedItemId = normalizeSessionLikeId(rawItemId)
      const compactItemId = normalizedItemId.replace(/[^a-z0-9]/g, '')
      const linkedSession =
        sessionByLookupKey.get(rawItemId) ??
        sessionByLookupKey.get(normalizedItemId) ??
        sessionByLookupKey.get(compactItemId) ??
        null
      const client = linkedSession?.coacheeId ? clientById.get(linkedSession.coacheeId) : null
      const sessionTitle = linkedSession?.title?.trim() || 'Onbekende sessie'
      const groupId = linkedSession ? linkedSession.id : `snippet-${rawItemId || snippet.id}`

      const existing = groupedSnippetItems.get(groupId)
      if (existing) {
        existing.pendingCount += 1
        existing.statusLabel = `${existing.pendingCount} open`
        existing.updatedAtUnixMs = Math.max(existing.updatedAtUnixMs, snippet.updatedAtUnixMs)
        existing.updatedLabel = toRelativeDateLabel(existing.updatedAtUnixMs)
        existing.createdAtUnixMs = Math.min(existing.createdAtUnixMs, snippet.createdAtUnixMs)
        existing.createdAtLabel = toDateLabel(existing.createdAtUnixMs)
        continue
      }

      groupedSnippetItems.set(groupId, {
        id: `snippet-${groupId}`,
        kind: 'snippet',
        itemLabel: `Sessie: ${sessionTitle}`,
        statusLabel: '1 open',
        clientId: linkedSession?.coacheeId ?? null,
        clientName: client?.name || 'Zonder client',
        sessionId: linkedSession?.id ?? null,
        createdAtLabel: toDateLabel(snippet.createdAtUnixMs),
        createdAtUnixMs: snippet.createdAtUnixMs,
        updatedLabel: toRelativeDateLabel(snippet.updatedAtUnixMs),
        updatedAtUnixMs: snippet.updatedAtUnixMs,
        pendingCount: 1,
      })
    }

    const snippetItems = [...groupedSnippetItems.values()].map(({ pendingCount: _pendingCount, ...item }) => item)

    return [...reportItems, ...snippetItems].sort((a, b) => b.updatedAtUnixMs - a.updatedAtUnixMs)
  }, [clientById, data.sessions, data.snippets, data.writtenReports, sessionByLookupKey])

  const filteredOpenActionItems = useMemo(() => {
    const normalizedQuery = String(openActionQuery || '').trim().toLowerCase()
    if (!normalizedQuery) return openActionItems.slice(0, 8)

    return openActionItems
      .filter(
        (item) =>
          item.itemLabel.toLowerCase().includes(normalizedQuery) ||
          item.clientName.toLowerCase().includes(normalizedQuery) ||
          item.statusLabel.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 8)
  }, [openActionItems, openActionQuery])

  const totalOpenActionItems = openActionItems.length

  const dashboardStatCards = useMemo<DashboardStatCardData[]>(() => {
    const now = new Date()
    const todayDay = now.getDay()
    const daysSinceMonday = (todayDay + 6) % 7
    const weekStartDate = new Date(now)
    weekStartDate.setDate(now.getDate() - daysSinceMonday)
    weekStartDate.setHours(0, 0, 0, 0)
    const weekStartUnixMs = weekStartDate.getTime()
    const weekEndUnixMs = weekStartUnixMs + 7 * 24 * 60 * 60 * 1000

    const sessionsThisWeek = data.sessions.filter(
      (session) => session.createdAtUnixMs >= weekStartUnixMs && session.createdAtUnixMs < weekEndUnixMs,
    ).length
    const reportsThisWeek = data.writtenReports.filter(
      (report) => report.updatedAtUnixMs >= weekStartUnixMs && report.updatedAtUnixMs < weekEndUnixMs,
    ).length
    const activeClients = data.coachees.filter((coachee) => !coachee.isArchived).length

    return [
      {
        id: 'active-clients',
        title: 'Actieve clients',
        value: String(activeClients),
        accentFrom: '#6E22B7',
        accentTo: '#8E32E8',
        onPress: props.onOpenClientsPage,
      },
      {
        id: 'sessions-this-week',
        title: 'Sessies deze week',
        value: String(sessionsThisWeek),
        accentFrom: '#1B4EC2',
        accentTo: '#2A6DFF',
        onPress: scrollToOpenActions,
      },
      {
        id: 'reports-this-week',
        title: 'Rapportages deze week',
        value: String(reportsThisWeek),
        accentFrom: '#0F7E3A',
        accentTo: '#1CB95C',
        onPress: props.onOpenReportsPage,
      },
      {
        id: 'open-action-items',
        title: 'Open actiepunten',
        value: String(totalOpenActionItems),
        accentFrom: '#C75D10',
        accentTo: '#F1852F',
        onPress: scrollToOpenActions,
      },
    ]
  }, [data.coachees, data.sessions, data.writtenReports, props.onOpenClientsPage, props.onOpenReportsPage, scrollToOpenActions, totalOpenActionItems])

  return {
    scrollRef,
    openActionInputRef,
    isStacked,
    openActionQuery,
    setOpenActionQuery,
    setOpenActionsOffsetY,
    quickInputActions,
    continueItems,
    filteredOpenActionItems,
    dashboardStatCards,
  }
}
