import { config } from '../../config'
import { getValidAccessToken } from '../../screens/authentication/internal/entraAuth'

type AnalyticsApp = 'website' | 'webapp'
export type AnalyticsEventType = 'visit' | 'click' | 'ai_message_sent' | 'error' | 'custom'

type AnalyticsEvent = {
  type: AnalyticsEventType
  action?: string | null
  path?: string | null
  anonymousId?: string | null
  sessionId?: string | null
  metadata?: Record<string, unknown>
  occurredAt?: string
}

type QueuedBatch = {
  app: AnalyticsApp
  events: AnalyticsEvent[]
}

const MAX_QUEUE_EVENTS = 200
const FLUSH_INTERVAL_MS = 2000

let queuedPublicEvents: QueuedBatch = { app: 'webapp', events: [] }
let queuedSecureEvents: QueuedBatch = { app: 'webapp', events: [] }
let flushTimeoutId: ReturnType<typeof setTimeout> | null = null

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function readOrCreateStorageId(key: string): string {
  const storage = getStorage()
  const existing = storage?.getItem(key)
  if (existing) return existing
  const next = `${key}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
  storage?.setItem(key, next)
  return next
}

export function getAnalyticsAnonymousId(): string {
  return readOrCreateStorageId('coachscribe_analytics_anon_id')
}

export function getAnalyticsSessionId(): string {
  return readOrCreateStorageId('coachscribe_analytics_session_id')
}

function enqueue(queue: QueuedBatch, event: AnalyticsEvent): QueuedBatch {
  const nextEvents = [...queue.events, event]
  if (nextEvents.length > MAX_QUEUE_EVENTS) {
    nextEvents.splice(0, nextEvents.length - MAX_QUEUE_EVENTS)
  }
  return { app: queue.app, events: nextEvents }
}

function scheduleFlush() {
  if (flushTimeoutId) return
  flushTimeoutId = setTimeout(() => {
    flushTimeoutId = null
    void flushAnalyticsQueues()
  }, FLUSH_INTERVAL_MS)
}

async function sendPublicBatch(batch: QueuedBatch): Promise<void> {
  if (batch.events.length === 0) return
  try {
    await fetch(`${config.api.baseUrl}/analytics/public/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batch),
      keepalive: true,
    })
  } catch {
    // Best effort; dropped when offline.
  }
}

async function sendSecureBatch(batch: QueuedBatch): Promise<void> {
  if (batch.events.length === 0) return
  try {
    const accessToken = await getValidAccessToken()
    if (!accessToken) {
      await sendPublicBatch(batch)
      return
    }
    await fetch(`${config.api.baseUrl}/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(batch),
      keepalive: true,
    })
  } catch {
    // Best effort; dropped when offline.
  }
}

export async function flushAnalyticsQueues(): Promise<void> {
  const publicBatch = queuedPublicEvents
  const secureBatch = queuedSecureEvents
  queuedPublicEvents = { app: 'webapp', events: [] }
  queuedSecureEvents = { app: 'webapp', events: [] }

  await Promise.all([sendPublicBatch(publicBatch), sendSecureBatch(secureBatch)])
}

function normalizeEvent(event: AnalyticsEvent): AnalyticsEvent {
  return {
    type: event.type,
    action: event.action ?? null,
    path: event.path ?? null,
    anonymousId: event.anonymousId ?? getAnalyticsAnonymousId(),
    sessionId: event.sessionId ?? getAnalyticsSessionId(),
    metadata: event.metadata ?? {},
    occurredAt: event.occurredAt ?? new Date().toISOString(),
  }
}

export function trackWebappEvent(event: AnalyticsEvent, options?: { authenticated?: boolean }) {
  const normalized = normalizeEvent(event)
  if (options?.authenticated) {
    queuedSecureEvents = enqueue(queuedSecureEvents, normalized)
  } else {
    queuedPublicEvents = enqueue(queuedPublicEvents, normalized)
  }
  scheduleFlush()
}

export function trackWebappError(error: unknown, metadata?: Record<string, unknown>, options?: { authenticated?: boolean }) {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack ?? null : null
  trackWebappEvent(
    {
      type: 'error',
      action: 'runtime_error',
      path: typeof window !== 'undefined' ? window.location.pathname : null,
      metadata: {
        message: String(message || '').slice(0, 500),
        stack: String(stack || '').slice(0, 1000),
        ...(metadata || {}),
      },
    },
    options,
  )
}
