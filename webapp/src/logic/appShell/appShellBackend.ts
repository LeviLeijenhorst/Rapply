import { clearPendingPreviewAudio, clearPendingPreviewAudioIfEligible, listPendingPreviewAudioTasks } from '../../audio/pendingPreviewStore'
import { deleteAccountApi, fetchCurrentUserProfileApi, fetchSubscriptionAccessApi, submitFeedbackApi } from '../../api/appShell'
import { processSessionAudio } from '../../audio/processSessionAudio'
import type { Session } from '../../local/types'

export type SubscriptionAccess = {
  canOpenSubscription: boolean
  currentPlanId: string | null
}

export type CurrentUserProfile = {
  email: string | null
  accountType: 'admin' | 'paid' | 'test' | null
  givenName: string | null
  surname: string | null
  displayName: string | null
}

function normalizeOptionalName(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const normalized = trimmed.toLowerCase()
  if (normalized === 'unknown' || normalized === 'onbekend' || normalized === 'n/a' || normalized === 'na') return null
  return trimmed
}

export async function fetchSubscriptionAccess(): Promise<SubscriptionAccess> {
  const response = await fetchSubscriptionAccessApi()
  return {
    canOpenSubscription: Boolean(response?.canSeePricingPage),
    currentPlanId: typeof response?.planId === 'string' ? response.planId : null,
  }
}

export async function fetchCurrentUserProfile(): Promise<CurrentUserProfile> {
  const response = await fetchCurrentUserProfileApi()

  const accountType = response?.accountType === 'admin' || response?.accountType === 'paid' || response?.accountType === 'test'
    ? response.accountType
    : null

  const givenName = normalizeOptionalName(response?.givenName)
  const surname = normalizeOptionalName(response?.surname)
  const fullNameFromEntra = [givenName, surname].filter(Boolean).join(' ').trim()
  const displayName = fullNameFromEntra || normalizeOptionalName(response?.name) || normalizeOptionalName(response?.displayName)

  return {
    email: typeof response?.email === 'string' ? response.email : null,
    accountType,
    givenName,
    surname,
    displayName,
  }
}

export async function resumePendingPreviewAudioTasks(params: {
  sessions: Session[]
  e2ee: any
  updateSession: (sessionId: string, values: Partial<Session>) => void
}): Promise<void> {
  const tasks = await listPendingPreviewAudioTasks()
  for (const task of tasks) {
    const session = params.sessions.find((item) => item.id === task.sessionId)
    if (!session) {
      await clearPendingPreviewAudio(task.sessionId)
      continue
    }
    if (session.transcriptionStatus === 'done' && !task.shouldSaveAudio) {
      await clearPendingPreviewAudio(task.sessionId)
      continue
    }
    if (session.transcriptionStatus === 'done' && Boolean(session.audioBlobId)) {
      await clearPendingPreviewAudioIfEligible(task.sessionId)
      continue
    }

    await processSessionAudio({
      sessionId: task.sessionId,
      audioBlob: task.blob,
      mimeType: task.mimeType,
      shouldSaveAudio: task.shouldSaveAudio,
      summaryTemplate: task.summaryTemplate,
      initialAudioBlobId: session.audioBlobId ?? null,
      e2ee: params.e2ee,
      updateSession: params.updateSession,
    })
  }
}

export async function requestDeleteAccount(): Promise<void> {
  await deleteAccountApi()
}

export async function submitFeedbackMessage(message: string): Promise<void> {
  await submitFeedbackApi(message)
}

