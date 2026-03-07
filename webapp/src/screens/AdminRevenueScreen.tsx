import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../ui/Text'
import {
  addAccountAllowlistEmail,
  addAdminUserMonthlyMinutes,
  getAdminAnalyticsOverview,
  getAdminTranscriptionMode,
  listAccountAllowlist,
  listAdminFeedback,
  listAdminPlans,
  listAdminUsers,
  removeAccountAllowlistEmail,
  setAdminTranscriptionMode,
  updateAdminUserPricingControls,
  upsertAdminPlan,
} from '../api/admin'
import { colors } from '../design/theme/colors'
import { toUserFriendlyErrorMessage } from '../utils/userFriendlyError'
import { useToast } from '../toast/ToastProvider'

type Plan = {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  minutesPerMonth: number
  isActive: boolean
  displayOrder: number
}

type AdminUser = {
  userId: string
  email: string | null
  displayName: string | null
  planId: string | null
  customMonthlyPrice: number | null
  extraMinutes: number
  accountType: 'admin' | 'paid' | 'test'
  isAllowlisted: boolean
  canSeePricingPage: boolean
  adminNotes: string | null
  pilotFlag: boolean
  planName: string | null
  availableMinutesPerMonth: number
}

type PlanListResponse = { items: Plan[] }
type UserListResponse = { items: AdminUser[] }
type AllowlistItem = {
  id: string
  email: string
  createdAt: string
}
type AllowlistResponse = { items: AllowlistItem[] }
type FeedbackItem = {
  id: string
  userId: string
  name: string | null
  email: string | null
  accountEmail: string | null
  message: string
  createdAt: string
}
type FeedbackListResponse = { items: FeedbackItem[] }
type TranscriptionMode = 'azure-fast-batch' | 'azure-realtime-live'
type TranscriptionProvider = 'azure' | 'speechmatics'
type TranscriptionModeResponse = { mode?: string; provider?: string; updatedAt?: string | null; updatedBy?: string | null }
type AnalyticsCounters = {
  websiteVisits: number
  websiteClicks: number
  webappVisits: number
  webappClicks: number
  webappAiMessages: number
  webappErrors: number
}
type AnalyticsUserMinutes = {
  userId: string
  email: string | null
  displayName: string | null
  totalMinutes: number
}
type AnalyticsEvent = {
  id: string
  app: 'website' | 'webapp'
  type: 'visit' | 'click' | 'ai_message_sent' | 'error' | 'custom'
  action: string | null
  path: string | null
  userId: string | null
  accountEmail: string | null
  anonymousId: string | null
  sessionId: string | null
  metadata: Record<string, unknown>
  occurredAt: string
}
type AnalyticsOverviewResponse = {
  windowDays: number
  counters: AnalyticsCounters
  perUserMinutes: AnalyticsUserMinutes[]
  recentEvents: AnalyticsEvent[]
}

type UserFormState = {
  planId: string | null
  customMonthlyPrice: string
  extraMinutes: string
  accountType: 'admin' | 'paid' | 'test'
  isAllowlisted: boolean
  canSeePricingPage: boolean
  pilotFlag: boolean
  adminNotes: string
}

function formatMoney(value: number | null): string {
  if (value == null) return '-'
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return value
  return parsed.toLocaleString('nl-NL')
}

function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!normalized) return null
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function minutesToReports(minutes: number): number {
  return Math.max(0, Math.floor(minutes / 60))
}

function buildUserLabel(user: AdminUser): string {
  const name = (user.displayName || '').trim()
  if (name) return `${name} (${user.email || user.userId})`
  return user.email || user.userId
}

function parseError(error: unknown): string {
  return toUserFriendlyErrorMessage(error, {
    fallback: 'Admingegevens ophalen mislukt.',
    forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
  })
}

export function AdminRevenueScreen() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allowlistItems, setAllowlistItems] = useState<AllowlistItem[]>([])
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserForm, setSelectedUserForm] = useState<UserFormState | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAllowlistLoading, setIsAllowlistLoading] = useState(false)
  const [isAllowlistBusy, setIsAllowlistBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [allowlistErrorMessage, setAllowlistErrorMessage] = useState<string | null>(null)
  const [allowlistStatusMessage, setAllowlistStatusMessage] = useState<string | null>(null)
  const [allowlistEmailInput, setAllowlistEmailInput] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>('azure-fast-batch')
  const [transcriptionProvider, setTranscriptionProvider] = useState<TranscriptionProvider>('azure')
  const [transcriptionModeUpdatedAt, setTranscriptionModeUpdatedAt] = useState<string | null>(null)
  const [isTranscriptionModeBusy, setIsTranscriptionModeBusy] = useState(false)
  const [addMonthlyMinutesInput, setAddMonthlyMinutesInput] = useState('')
  const [analyticsWindowDays, setAnalyticsWindowDays] = useState(30)
  const [analyticsCounters, setAnalyticsCounters] = useState<AnalyticsCounters>({
    websiteVisits: 0,
    websiteClicks: 0,
    webappVisits: 0,
    webappClicks: 0,
    webappAiMessages: 0,
    webappErrors: 0,
  })
  const [analyticsUserMinutes, setAnalyticsUserMinutes] = useState<AnalyticsUserMinutes[]>([])
  const [analyticsRecentEvents, setAnalyticsRecentEvents] = useState<AnalyticsEvent[]>([])
  const { showErrorToast } = useToast()

  function normalizeTranscriptionMode(value: unknown): TranscriptionMode {
    return String(value || '').trim().toLowerCase() === 'azure-realtime-live' ? 'azure-realtime-live' : 'azure-fast-batch'
  }
  function normalizeTranscriptionProvider(value: unknown): TranscriptionProvider {
    return String(value || '').trim().toLowerCase() === 'speechmatics' ? 'speechmatics' : 'azure'
  }

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)
      const [plansResponse, usersResponse, feedbackResponse, transcriptionModeResponse, analyticsResponse] = await Promise.all([
        listAdminPlans() as Promise<PlanListResponse>,
        listAdminUsers() as Promise<UserListResponse>,
        listAdminFeedback(200) as Promise<FeedbackListResponse>,
        getAdminTranscriptionMode() as Promise<TranscriptionModeResponse>,
        getAdminAnalyticsOverview(30) as Promise<AnalyticsOverviewResponse>,
      ])
      const nextPlans = Array.isArray(plansResponse.items) ? plansResponse.items : []
      const nextUsers = Array.isArray(usersResponse.items) ? usersResponse.items : []
      const nextFeedbackItems = Array.isArray(feedbackResponse.items) ? feedbackResponse.items : []
      setPlans(nextPlans)
      setUsers(nextUsers)
      setFeedbackItems(nextFeedbackItems)
      setTranscriptionMode(normalizeTranscriptionMode(transcriptionModeResponse?.mode))
      setTranscriptionProvider(normalizeTranscriptionProvider(transcriptionModeResponse?.provider))
      setTranscriptionModeUpdatedAt(transcriptionModeResponse?.updatedAt ?? null)
      setAnalyticsWindowDays(Number(analyticsResponse?.windowDays || 30))
      setAnalyticsCounters({
        websiteVisits: Number(analyticsResponse?.counters?.websiteVisits || 0),
        websiteClicks: Number(analyticsResponse?.counters?.websiteClicks || 0),
        webappVisits: Number(analyticsResponse?.counters?.webappVisits || 0),
        webappClicks: Number(analyticsResponse?.counters?.webappClicks || 0),
        webappAiMessages: Number(analyticsResponse?.counters?.webappAiMessages || 0),
        webappErrors: Number(analyticsResponse?.counters?.webappErrors || 0),
      })
      setAnalyticsUserMinutes(Array.isArray(analyticsResponse?.perUserMinutes) ? analyticsResponse.perUserMinutes : [])
      setAnalyticsRecentEvents(Array.isArray(analyticsResponse?.recentEvents) ? analyticsResponse.recentEvents.slice(0, 80) : [])
      setSelectedUserId((current) => {
        if (current && nextUsers.some((user) => user.userId === current)) return current
        return nextUsers[0]?.userId ?? null
      })
    } catch (error) {
      setErrorMessage(parseError(error))
      setPlans([])
      setUsers([])
      setFeedbackItems([])
      setTranscriptionMode('azure-fast-batch')
      setTranscriptionProvider('azure')
      setTranscriptionModeUpdatedAt(null)
      setAnalyticsWindowDays(30)
      setAnalyticsCounters({
        websiteVisits: 0,
        websiteClicks: 0,
        webappVisits: 0,
        webappClicks: 0,
        webappAiMessages: 0,
        webappErrors: 0,
      })
      setAnalyticsUserMinutes([])
      setAnalyticsRecentEvents([])
      setSelectedUserId(null)
      setSelectedUserForm(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadAllowlist = useCallback(async () => {
    try {
      setIsAllowlistLoading(true)
      setAllowlistErrorMessage(null)
      const response = await listAccountAllowlist() as AllowlistResponse
      setAllowlistItems(Array.isArray(response.items) ? response.items : [])
    } catch (error) {
      setAllowlistItems([])
      setAllowlistErrorMessage(
        toUserFriendlyErrorMessage(error, {
          fallback: 'Allowlist ophalen mislukt.',
          forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
        }),
      )
    } finally {
      setIsAllowlistLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
    void loadAllowlist()
  }, [loadAllowlist, loadData])

  useEffect(() => {
    if (!errorMessage) return
    showErrorToast(errorMessage, 'Admingegevens ophalen mislukt.')
  }, [errorMessage, showErrorToast])

  useEffect(() => {
    if (!allowlistErrorMessage) return
    showErrorToast(allowlistErrorMessage, 'Allowlist ophalen mislukt.')
  }, [allowlistErrorMessage, showErrorToast])

  const saveTranscriptionSettings = useCallback(async (settings: { mode?: TranscriptionMode; provider?: TranscriptionProvider }) => {
    try {
      setIsTranscriptionModeBusy(true)
      setStatusMessage(null)
      const response = await setAdminTranscriptionMode(settings) as TranscriptionModeResponse
      setTranscriptionMode(normalizeTranscriptionMode(response?.mode))
      setTranscriptionProvider(normalizeTranscriptionProvider(response?.provider))
      setTranscriptionModeUpdatedAt(response?.updatedAt ?? null)
      if (settings.provider) {
        setStatusMessage(`Transcriptieprovider opgeslagen: ${settings.provider === 'speechmatics' ? 'Speechmatics' : 'Azure'}`)
      } else if (settings.mode) {
        setStatusMessage(`Transcriptiemodus opgeslagen: ${settings.mode === 'azure-realtime-live' ? 'Realtime tijdens opname' : 'Batch na opname'}`)
      }
    } catch (error) {
      showErrorToast(parseError(error), 'Instellingen opslaan mislukt.')
    } finally {
      setIsTranscriptionModeBusy(false)
    }
  }, [showErrorToast])

  const addAllowlistEmail = useCallback(async () => {
    const trimmedEmail = allowlistEmailInput.trim().toLowerCase()
    if (!trimmedEmail) {
      setAllowlistStatusMessage('Vul eerst een e-mailadres in.')
      return
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(trimmedEmail)) {
      setAllowlistStatusMessage('Gebruik een geldig e-mailadres.')
      return
    }

    try {
      setIsAllowlistBusy(true)
      setAllowlistStatusMessage(null)
      await addAccountAllowlistEmail(trimmedEmail)
      setAllowlistEmailInput('')
      setAllowlistStatusMessage('E-mailadres toegevoegd aan de allowlist.')
      await loadAllowlist()
    } catch (error) {
      showErrorToast(
        toUserFriendlyErrorMessage(error, {
          fallback: 'Toevoegen mislukt.',
          forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
        }),
        'Toevoegen mislukt.',
      )
    } finally {
      setIsAllowlistBusy(false)
    }
  }, [allowlistEmailInput, loadAllowlist, showErrorToast])

  const removeAllowlistEmail = useCallback(
    async (email: string) => {
      try {
        setIsAllowlistBusy(true)
        setAllowlistStatusMessage(null)
        await removeAccountAllowlistEmail(email)
        setAllowlistStatusMessage('E-mailadres verwijderd uit de allowlist.')
        await loadAllowlist()
      } catch (error) {
        showErrorToast(
          toUserFriendlyErrorMessage(error, {
            fallback: 'Verwijderen mislukt.',
            forbiddenMessage: 'Geen toegang. Alleen contact@jnlsolutions.nl mag deze pagina openen.',
          }),
          'Verwijderen mislukt.',
        )
      } finally {
        setIsAllowlistBusy(false)
      }
    },
    [loadAllowlist, showErrorToast],
  )

  const selectedUser = useMemo(
    () => users.find((user) => user.userId === selectedUserId) || null,
    [selectedUserId, users],
  )

  useEffect(() => {
    if (!selectedUser) {
      setSelectedUserForm(null)
      setAddMonthlyMinutesInput('')
      return
    }
    setAddMonthlyMinutesInput('')
    setSelectedUserForm({
      planId: selectedUser.planId,
      customMonthlyPrice: selectedUser.customMonthlyPrice == null ? '' : String(selectedUser.customMonthlyPrice),
      extraMinutes: String(selectedUser.extraMinutes),
      accountType: selectedUser.accountType,
      isAllowlisted: selectedUser.isAllowlisted,
      canSeePricingPage: selectedUser.canSeePricingPage,
      pilotFlag: selectedUser.pilotFlag,
      adminNotes: selectedUser.adminNotes || '',
    })
  }, [selectedUser])

  const savePlan = useCallback(async (plan: Plan) => {
    const monthlyPrice = Number(plan.monthlyPrice)
    const minutesPerMonth = Number(plan.minutesPerMonth)
    const name = plan.name.trim()
    if (!name || !Number.isFinite(monthlyPrice) || monthlyPrice < 0 || !Number.isFinite(minutesPerMonth) || minutesPerMonth < 0) {
      setStatusMessage('Vul een geldige plannaam, prijs en minuten in.')
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage(null)
      await upsertAdminPlan({
        id: plan.id,
        name,
        description: plan.description || '',
        monthlyPrice,
        minutesPerMonth: Math.trunc(minutesPerMonth),
        isActive: plan.isActive,
        displayOrder: plan.displayOrder,
      })
      setStatusMessage(`Plan opgeslagen: ${name}`)
      await loadData()
    } catch (error) {
      showErrorToast(parseError(error), 'Plan opslaan mislukt.')
    } finally {
      setIsBusy(false)
    }
  }, [loadData, showErrorToast])

  const saveSelectedUser = useCallback(async () => {
    if (!selectedUser || !selectedUserForm) return
    const customMonthlyPriceRaw = selectedUserForm.customMonthlyPrice.trim()
    const parsedCustomMonthlyPrice = customMonthlyPriceRaw.length > 0 ? parseDecimalInput(customMonthlyPriceRaw) : null
    const extraMinutes = Number(selectedUserForm.extraMinutes)
    if (!Number.isFinite(extraMinutes) || extraMinutes < 0) {
      setStatusMessage('Extra minuten moeten 0 of hoger zijn.')
      return
    }
    if (customMonthlyPriceRaw.length > 0 && (parsedCustomMonthlyPrice == null || parsedCustomMonthlyPrice < 0)) {
      setStatusMessage('Custom prijs p/m moet een geldig bedrag zijn (bijv. 49,95).')
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage(null)
      await updateAdminUserPricingControls({
        userId: selectedUser.userId,
        planId: selectedUserForm.planId,
        customMonthlyPrice: parsedCustomMonthlyPrice,
        extraMinutes: Math.trunc(extraMinutes),
        accountType: selectedUserForm.accountType,
        isAllowlisted: selectedUserForm.isAllowlisted,
        canSeePricingPage: selectedUserForm.canSeePricingPage,
        pilotFlag: selectedUserForm.pilotFlag,
        adminNotes: selectedUserForm.adminNotes.trim(),
      })
      setStatusMessage(`Gebruiker opgeslagen: ${buildUserLabel(selectedUser)}`)
      await loadData()
    } catch (error) {
      showErrorToast(parseError(error), 'Gebruiker opslaan mislukt.')
    } finally {
      setIsBusy(false)
    }
  }, [loadData, selectedUser, selectedUserForm, showErrorToast])

  const addMonthlyMinutes = useCallback(async () => {
    if (!selectedUser) return
    const additionalMinutesRaw = Number(addMonthlyMinutesInput)
    if (!Number.isFinite(additionalMinutesRaw) || additionalMinutesRaw <= 0) {
      setStatusMessage('Voer een geldig aantal extra minuten per maand in.')
      return
    }

    try {
      setIsBusy(true)
      setStatusMessage(null)
      const response = await addAdminUserMonthlyMinutes({
        userId: selectedUser.userId,
        additionalMinutes: Math.trunc(additionalMinutesRaw),
      }) as { ok: true; addedMinutes: number; extraMinutes: number; availableMinutesPerMonth: number }
      setStatusMessage(
        `${response.addedMinutes} minuten per maand toegevoegd. Nieuw extra totaal: ${response.extraMinutes} min. Beschikbaar per maand: ${response.availableMinutesPerMonth} min.`,
      )
      setAddMonthlyMinutesInput('')
      await loadData()
    } catch (error) {
      showErrorToast(parseError(error), 'Extra minuten toevoegen mislukt.')
    } finally {
      setIsBusy(false)
    }
  }, [addMonthlyMinutesInput, loadData, selectedUser, showErrorToast])

  function updatePlanValue(planId: string, patch: Partial<Plan>) {
    setPlans((prev) => prev.map((plan) => (plan.id === planId ? { ...plan, ...patch } : plan)))
  }

  return (
    <View style={styles.page}>
      <View style={styles.headerRow}>
        <View>
          <Text isBold style={styles.title}>Admin pricing</Text>
          <Text style={styles.subtitle}>Handmatige verkoopflow en planbeheer</Text>
        </View>
        <Pressable onPress={() => void loadData()} style={({ hovered }) => [styles.refreshButton, hovered ? styles.refreshButtonHovered : undefined]} disabled={isLoading || isBusy}>
          <Text isBold style={styles.refreshButtonText}>{isLoading ? 'Laden...' : 'Verversen'}</Text>
        </Pressable>
      </View>

      {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Analytics</Text>
          <Text style={styles.cardSubtitle}>In de laatste {analyticsWindowDays} dagen</Text>
          <View style={styles.analyticsGrid}>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.websiteVisits}</Text>
              <Text style={styles.analyticsMetricLabel}>Website bezoeken</Text>
            </View>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.websiteClicks}</Text>
              <Text style={styles.analyticsMetricLabel}>Website clicks</Text>
            </View>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.webappVisits}</Text>
              <Text style={styles.analyticsMetricLabel}>Webapp bezoeken</Text>
            </View>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.webappClicks}</Text>
              <Text style={styles.analyticsMetricLabel}>Webapp clicks</Text>
            </View>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.webappAiMessages}</Text>
              <Text style={styles.analyticsMetricLabel}>AI-berichten verstuurd</Text>
            </View>
            <View style={styles.analyticsMetricCard}>
              <Text isSemibold style={styles.analyticsMetricValue}>{analyticsCounters.webappErrors}</Text>
              <Text style={styles.analyticsMetricLabel}>Webapp errors</Text>
            </View>
          </View>

          <Text isSemibold style={styles.cardTitle}>Minuten per gebruiker</Text>
          {analyticsUserMinutes.length === 0 ? (
            <Text style={styles.cardSubtitle}>Nog geen minuten gevonden.</Text>
          ) : (
            <View style={styles.analyticsList}>
              {analyticsUserMinutes.slice(0, 40).map((item) => (
                <View key={item.userId} style={styles.analyticsListRow}>
                  <Text style={styles.analyticsListLabel}>{item.displayName || item.email || item.userId}</Text>
                  <Text style={styles.analyticsListValue}>{item.totalMinutes} min</Text>
                </View>
              ))}
            </View>
          )}

          <Text isSemibold style={styles.cardTitle}>Recente analytics events</Text>
          {analyticsRecentEvents.length === 0 ? (
            <Text style={styles.cardSubtitle}>Nog geen events gevonden.</Text>
          ) : (
            <View style={styles.analyticsEventList}>
              {analyticsRecentEvents.slice(0, 50).map((event) => (
                <View key={event.id} style={styles.analyticsEventItem}>
                  <View style={styles.feedbackMetaRow}>
                    <Text isSemibold style={styles.feedbackMetaTitle}>{formatDateTime(event.occurredAt)}</Text>
                    <Text style={styles.feedbackMetaMuted}>{event.accountEmail || event.userId || event.anonymousId || '-'}</Text>
                  </View>
                  <Text style={styles.feedbackMetaLine}>{event.app} | {event.type} | {event.action || '-'}</Text>
                  <Text style={styles.feedbackMetaLine}>{event.path || '-'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.feedbackHeaderRow}>
            <View>
              <Text isSemibold style={styles.cardTitle}>Feedback</Text>
              <Text style={styles.cardSubtitle}>{feedbackItems.length} berichten</Text>
            </View>
            <Pressable
              onPress={() => void loadData()}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
              disabled={isLoading || isBusy}
            >
              <Text isBold style={styles.secondaryButtonText}>Verversen</Text>
            </Pressable>
          </View>
          {isLoading ? (
            <Text style={styles.cardSubtitle}>Feedback laden...</Text>
          ) : feedbackItems.length === 0 ? (
            <Text style={styles.cardSubtitle}>Nog geen feedback gevonden.</Text>
          ) : (
            <View style={styles.feedbackList}>
              {feedbackItems.map((item) => (
                <View key={item.id} style={styles.feedbackItem}>
                  <View style={styles.feedbackMetaRow}>
                    <Text isSemibold style={styles.feedbackMetaTitle}>{formatDateTime(item.createdAt)}</Text>
                    <Text style={styles.feedbackMetaMuted}>{item.accountEmail || item.userId}</Text>
                  </View>
                  <Text style={styles.feedbackMetaLine}>Naam: {item.name || '-'}</Text>
                  <Text style={styles.feedbackMetaLine}>Feedback e-mail: {item.email || '-'}</Text>
                  <Text style={styles.feedbackMessage}>{item.message}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.allowlistHeaderRow}>
            <View>
              <Text isSemibold style={styles.cardTitle}>Account allowlist</Text>
              <Text style={styles.cardSubtitle}>Alleen e-mails in deze lijst kunnen inloggen in de webapp.</Text>
            </View>
            <Pressable
              onPress={() => void loadAllowlist()}
              style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}
              disabled={isAllowlistLoading || isAllowlistBusy}
            >
              <Text isBold style={styles.secondaryButtonText}>Verversen</Text>
            </Pressable>
          </View>

          <View style={styles.allowlistAddRow}>
            <TextInput
              value={allowlistEmailInput}
              onChangeText={setAllowlistEmailInput}
              placeholder="naam@voorbeeld.nl"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              editable={!isAllowlistBusy}
            />
            <Pressable
              onPress={() => void addAllowlistEmail()}
              style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isAllowlistBusy ? styles.buttonDisabled : undefined]}
              disabled={isAllowlistBusy}
            >
              <Text isBold style={styles.primaryButtonText}>Toevoegen</Text>
            </Pressable>
          </View>

          {allowlistStatusMessage ? <Text style={styles.statusText}>{allowlistStatusMessage}</Text> : null}

          {isAllowlistLoading ? (
            <Text style={styles.cardSubtitle}>Allowlist laden...</Text>
          ) : allowlistItems.length === 0 ? (
            <Text style={styles.cardSubtitle}>Nog geen e-mailadressen in de allowlist.</Text>
          ) : (
            <View style={styles.allowlistList}>
              {allowlistItems.map((item) => (
                <View key={item.id} style={styles.allowlistItemRow}>
                  <View style={styles.allowlistItemTextWrap}>
                    <Text style={styles.allowlistItemEmail}>{item.email}</Text>
                    <Text style={styles.allowlistItemMeta}>Toegevoegd op {formatDateTime(item.createdAt)}</Text>
                  </View>
                  <Pressable
                    onPress={() => void removeAllowlistEmail(item.email)}
                    style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined, isAllowlistBusy ? styles.buttonDisabled : undefined]}
                    disabled={isAllowlistBusy}
                  >
                    <Text isBold style={styles.secondaryButtonText}>Verwijderen</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Transcriptiemodus</Text>
          <Text style={styles.cardSubtitle}>Kies tussen batch na opname of realtime tijdens opname met sprekerlabels.</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => void saveTranscriptionSettings({ mode: 'azure-fast-batch' })}
              style={({ hovered }) => [
                styles.accountTypeButton,
                transcriptionMode === 'azure-fast-batch' ? styles.accountTypeButtonSelected : undefined,
                hovered ? styles.secondaryButtonHovered : undefined,
                isTranscriptionModeBusy ? styles.buttonDisabled : undefined,
              ]}
              disabled={isTranscriptionModeBusy}
            >
              <Text isBold style={transcriptionMode === 'azure-fast-batch' ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>
                Batch na opname
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void saveTranscriptionSettings({ mode: 'azure-realtime-live' })}
              style={({ hovered }) => [
                styles.accountTypeButton,
                transcriptionMode === 'azure-realtime-live' ? styles.accountTypeButtonSelected : undefined,
                hovered ? styles.secondaryButtonHovered : undefined,
                isTranscriptionModeBusy ? styles.buttonDisabled : undefined,
              ]}
              disabled={isTranscriptionModeBusy}
            >
              <Text isBold style={transcriptionMode === 'azure-realtime-live' ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>
                Realtime tijdens opname
              </Text>
            </Pressable>
          </View>
          <Text isSemibold style={styles.fieldLabel}>Provider</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => void saveTranscriptionSettings({ provider: 'azure' })}
              style={({ hovered }) => [
                styles.accountTypeButton,
                transcriptionProvider === 'azure' ? styles.accountTypeButtonSelected : undefined,
                hovered ? styles.secondaryButtonHovered : undefined,
                isTranscriptionModeBusy ? styles.buttonDisabled : undefined,
              ]}
              disabled={isTranscriptionModeBusy}
            >
              <Text isBold style={transcriptionProvider === 'azure' ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>
                Azure
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void saveTranscriptionSettings({ provider: 'speechmatics' })}
              style={({ hovered }) => [
                styles.accountTypeButton,
                transcriptionProvider === 'speechmatics' ? styles.accountTypeButtonSelected : undefined,
                hovered ? styles.secondaryButtonHovered : undefined,
                isTranscriptionModeBusy ? styles.buttonDisabled : undefined,
              ]}
              disabled={isTranscriptionModeBusy}
            >
              <Text isBold style={transcriptionProvider === 'speechmatics' ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>
                Speechmatics
              </Text>
            </Pressable>
          </View>
          {transcriptionModeUpdatedAt ? (
            <Text style={styles.cardSubtitle}>Laatst aangepast: {formatDateTime(transcriptionModeUpdatedAt)}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Plannen</Text>
          <Text style={styles.cardSubtitle}>Er is 1 beheerd plan. Je kunt alleen dit plan aanpassen.</Text>

          {plans.map((plan) => (
            <View key={plan.id} style={styles.planRow}>
              <View style={styles.planInputRow}>
                <TextInput value={plan.name} onChangeText={(value) => updatePlanValue(plan.id, { name: value })} placeholder="Naam" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />
                <TextInput value={String(plan.monthlyPrice)} onChangeText={(value) => updatePlanValue(plan.id, { monthlyPrice: Number(value) || 0 })} placeholder="Prijs" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
                <TextInput value={String(plan.minutesPerMonth)} onChangeText={(value) => updatePlanValue(plan.id, { minutesPerMonth: Number(value) || 0 })} placeholder="Minuten" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.inputSmall} editable={!isBusy} />
              </View>
              <Text style={styles.cardSubtitle}>Wordt getoond als ongeveer {minutesToReports(plan.minutesPerMonth)} gespreksverslagen.</Text>
              <TextInput value={plan.description || ''} onChangeText={(value) => updatePlanValue(plan.id, { description: value })} placeholder="Omschrijving" placeholderTextColor={colors.textSecondary} style={styles.input} editable={!isBusy} />
              <View style={styles.planActionsRow}>
                <Pressable onPress={() => void savePlan(plan)} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]} disabled={isBusy}>
                  <Text isBold style={styles.primaryButtonText}>Opslaan</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text isSemibold style={styles.cardTitle}>Gebruikers</Text>
          <Text style={styles.cardSubtitle}>Flow: kies gebruiker, zet allowlist aan, koppel plan, stel prijs/minuten in, noteer deal, opslaan.</Text>

          <View style={styles.usersLayout}>
            <View style={styles.userList}>
              {users.map((user) => (
                <Pressable key={user.userId} onPress={() => setSelectedUserId(user.userId)} style={({ hovered }) => [styles.userRow, selectedUserId === user.userId ? styles.userRowSelected : undefined, hovered ? styles.userRowHovered : undefined]}>
                  <Text isSemibold style={styles.userRowTitle}>{buildUserLabel(user)}</Text>
                  <Text style={styles.userRowMeta}>{user.planName || 'Custom plan'} | {formatMoney(user.customMonthlyPrice)} | {user.availableMinutesPerMonth} min</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.userEditor}>
              {!selectedUser || !selectedUserForm ? (
                <Text style={styles.emptyText}>Selecteer een gebruiker</Text>
              ) : (
                <>
                  <Text isSemibold style={styles.selectedUserTitle}>{buildUserLabel(selectedUser)}</Text>

                  <View style={styles.toggleRow}>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, isAllowlisted: !prev.isAllowlisted } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Allowlist: {selectedUserForm.isAllowlisted ? 'Aan' : 'Uit'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, canSeePricingPage: !prev.canSeePricingPage } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Pricing zichtbaar: {selectedUserForm.canSeePricingPage ? 'Ja' : 'Nee'}</Text>
                    </Pressable>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, pilotFlag: !prev.pilotFlag } : prev))} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={styles.secondaryButtonText}>Pilot: {selectedUserForm.pilotFlag ? 'Ja' : 'Nee'}</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.fieldLabel}>Account type</Text>
                  <View style={styles.toggleRow}>
                    {(['admin', 'paid', 'test'] as const).map((accountType) => (
                      <Pressable key={accountType} onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, accountType } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.accountType === accountType ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                        <Text isBold style={selectedUserForm.accountType === accountType ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>{accountType}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.fieldLabel}>Plan</Text>
                  <View style={styles.planSelectorWrap}>
                    <Pressable onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, planId: null } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.planId == null ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                      <Text isBold style={selectedUserForm.planId == null ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>Custom plan</Text>
                    </Pressable>
                    {plans.map((plan) => (
                      <Pressable key={plan.id} onPress={() => setSelectedUserForm((prev) => (prev ? { ...prev, planId: plan.id } : prev))} style={({ hovered }) => [styles.accountTypeButton, selectedUserForm.planId === plan.id ? styles.accountTypeButtonSelected : undefined, hovered ? styles.secondaryButtonHovered : undefined]}>
                        <Text isBold style={selectedUserForm.planId === plan.id ? styles.accountTypeButtonTextSelected : styles.accountTypeButtonText}>{plan.name}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.userInputRow}>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Custom prijs p/m (optioneel)</Text>
                      <TextInput
                        value={selectedUserForm.customMonthlyPrice}
                        onChangeText={(value) =>
                          setSelectedUserForm((prev) => {
                            if (!prev) return prev
                            const trimmed = value.trim()
                            return {
                              ...prev,
                              customMonthlyPrice: value,
                              planId: trimmed.length > 0 ? null : prev.planId,
                            }
                          })
                        }
                        placeholder="bijv. 49.95"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Extra minuten p/m (totaal)</Text>
                      <TextInput value={selectedUserForm.extraMinutes} onChangeText={(value) => setSelectedUserForm((prev) => (prev ? { ...prev, extraMinutes: value } : prev))} placeholder="0" placeholderTextColor={colors.textSecondary} keyboardType="numeric" style={styles.input} />
                    </View>
                  </View>
                  <View style={styles.userInputRow}>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Extra minuten p/m toevoegen</Text>
                      <TextInput
                        value={addMonthlyMinutesInput}
                        onChangeText={setAddMonthlyMinutesInput}
                        placeholder="bijv. 300"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.fieldColumn}>
                      <Text style={styles.fieldLabel}>Snelle actie</Text>
                      <Pressable
                        onPress={() => void addMonthlyMinutes()}
                        style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined, isBusy ? styles.buttonDisabled : undefined]}
                        disabled={isBusy}
                      >
                        <Text isBold style={styles.primaryButtonText}>Minuten toevoegen</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.fieldLabel}>Admin notities</Text>
                  <TextInput value={selectedUserForm.adminNotes} onChangeText={(value) => setSelectedUserForm((prev) => (prev ? { ...prev, adminNotes: value } : prev))} placeholder="Deal details / afspraken" placeholderTextColor={colors.textSecondary} multiline style={styles.notesInput} />

                  <Pressable onPress={() => void saveSelectedUser()} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]} disabled={isBusy}>
                    <Text isBold style={styles.primaryButtonText}>Gebruiker opslaan</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.pageBackground,
    padding: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  refreshButton: {
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.selected,
  },
  refreshButtonHovered: {
    opacity: 0.9,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 16,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 17,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  analyticsMetricCard: {
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.pageBackground,
    gap: 2,
  },
  analyticsMetricValue: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  analyticsMetricLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  analyticsList: {
    gap: 6,
  },
  analyticsListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.pageBackground,
  },
  analyticsListLabel: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textStrong,
  },
  analyticsListValue: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  analyticsEventList: {
    gap: 8,
  },
  analyticsEventItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.pageBackground,
    gap: 4,
  },
  allowlistHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackList: {
    gap: 8,
  },
  feedbackItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.pageBackground,
    gap: 4,
  },
  feedbackMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  feedbackMetaTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textStrong,
  },
  feedbackMetaMuted: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  feedbackMetaLine: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  feedbackMessage: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  allowlistAddRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  allowlistList: {
    gap: 8,
  },
  allowlistItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    backgroundColor: colors.pageBackground,
  },
  allowlistItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  allowlistItemEmail: {
    color: colors.textStrong,
    fontSize: 14,
    lineHeight: 18,
  },
  allowlistItemMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.textStrong,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textSecondary,
  },
  planRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  planInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  inputSmall: {
    width: 120,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  usersLayout: {
    flexDirection: 'row',
    gap: 12,
  },
  userList: {
    width: 360,
    gap: 8,
  },
  userRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    padding: 10,
    gap: 2,
  },
  userRowSelected: {
    borderColor: colors.selected,
    backgroundColor: '#FCE3F2',
  },
  userRowHovered: {
    opacity: 0.95,
  },
  userRowTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: colors.textStrong,
  },
  userRowMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  userEditor: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.pageBackground,
    padding: 12,
    gap: 10,
  },
  selectedUserTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  secondaryButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  accountTypeButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTypeButtonSelected: {
    borderColor: colors.selected,
    backgroundColor: '#FCE3F2',
  },
  accountTypeButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  accountTypeButtonTextSelected: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
  },
  fieldLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  planSelectorWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldColumn: {
    flex: 1,
    gap: 6,
  },
  notesInput: {
    minHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    ...( { textAlignVertical: 'top' } as any ),
  },
  primaryButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    opacity: 0.9,
  },
  primaryButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
})

