import { useMemo, useRef } from 'react'
import type { ScrollView } from 'react-native'
import { useWindowDimensions } from 'react-native'

import { useLocalAppData } from '@/storage/LocalAppDataProvider'

import type {
  DashboardContinueItem,
  DashboardQuickInputAction,
  DashboardQuickInputId,
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

function getQuickInputActions(onOpenRecord: DashboardScreenProps['onOpenRecord']): DashboardQuickInputAction[] {
  const create = (
    id: DashboardQuickInputId,
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
    onPress: () => onOpenRecord(id),
  })

  return [
    create('record-session', 'record-session', 'Gesprek opnemen', 'Neem een volledige sessie op', '#6E22B7', '#8E32E8'),
    create('record-summary', 'record-summary', 'Samenvatting opnemen', 'Maak een spraakopname over een sessie', '#1B4EC2', '#2A6DFF'),
    create('write-report', 'write-report', 'Samenvatting schrijven', 'Werk je samenvatting handmatig uit', '#0F7E3A', '#1CB95C'),
    create('record-video', 'record-video', 'Online meeting opnemen', 'Neem een videocall op in je browser', '#0F7E3A', '#1CB95C'),
    create('import-audio', 'import-audio', 'Audiobestand uploaden', 'Selecteer een audio file van je computer', '#C75D10', '#F1852F'),
    create('import-document', 'import-document', 'Ander bestand uploaden', 'Selecteer een document van je computer', '#9C0154', '#D51477'),
  ]
}

function toWelcomeName(value: string | null | undefined): string {
  return String(value || '').trim()
}

export function useDashboardScreenModel(props: DashboardScreenProps): DashboardScreenModel {
  const { width } = useWindowDimensions()
  const { data } = useLocalAppData()
  const scrollRef = useRef<ScrollView | null>(null)

  const isStacked = width < 1180
  const welcomeName = toWelcomeName(props.welcomeName)

  const clientById = useMemo(
    () =>
      new Map(
        data.clients.map((client) => [
          client.id,
          {
            name: String(client.name || '').trim() || 'Onbekende client',
            profilePhotoUri: pickProfilePhotoUri(client.clientDetails),
          },
        ]),
      ),
    [data.clients],
  )

  const quickInputActions = useMemo(() => getQuickInputActions(props.onOpenRecord), [props.onOpenRecord])

  const continueItems = useMemo<DashboardContinueItem[]>(
    () =>
      [...data.inputs]
        .sort((a, b) => b.createdAtUnixMs - a.createdAtUnixMs)
        .filter((session) => !!session.clientId)
        .slice(0, 5)
        .map((session) => {
          const client = session.clientId ? clientById.get(session.clientId) : null
          const title = String(session.title || '').trim() || 'Naamloze sessie'
          return {
            id: session.id,
            clientId: session.clientId || '',
            clientName: client?.name || 'Onbekende client',
            subtitle: formatContinueSubtitle(session.kind, title),
            profilePhotoUri: client?.profilePhotoUri || null,
          }
        }),
    [clientById, data.inputs],
  )

  const dashboardStatCards = useMemo<DashboardStatCardData[]>(() => {
    const now = new Date()
    const todayDay = now.getDay()
    const daysSinceMonday = (todayDay + 6) % 7
    const weekStartDate = new Date(now)
    weekStartDate.setDate(now.getDate() - daysSinceMonday)
    weekStartDate.setHours(0, 0, 0, 0)
    const weekStartUnixMs = weekStartDate.getTime()
    const weekEndUnixMs = weekStartUnixMs + 7 * 24 * 60 * 60 * 1000

    const inputsThisWeek = data.inputs.filter(
      (session) => session.createdAtUnixMs >= weekStartUnixMs && session.createdAtUnixMs < weekEndUnixMs,
    ).length
    const reportsThisWeek = data.inputSummaries.filter(
      (report) => report.updatedAtUnixMs >= weekStartUnixMs && report.updatedAtUnixMs < weekEndUnixMs,
    ).length
    const activeClients = data.clients.filter((client) => !client.isArchived).length

    return [
      {
        id: 'active-clients',
        title: 'Actieve clienten',
        value: String(activeClients),
        accentFrom: '#6E22B7',
        accentTo: '#8E32E8',
        onPress: props.onOpenClientsPage,
      },
      {
        id: 'inputs-this-week',
        title: 'Sessies deze week',
        value: String(inputsThisWeek),
        accentFrom: '#1B4EC2',
        accentTo: '#2A6DFF',
      },
      {
        id: 'reports-this-week',
        title: 'Rapportage deze week',
        value: String(reportsThisWeek),
        accentFrom: '#0F7E3A',
        accentTo: '#1CB95C',
        onPress: props.onOpenReportsPage,
      },
    ]
  }, [data.clients, data.inputs, data.inputSummaries, props.onOpenClientsPage, props.onOpenReportsPage])

  return {
    scrollRef,
    isStacked,
    welcomeName,
    quickInputActions,
    continueItems,
    dashboardStatCards,
  }
}
