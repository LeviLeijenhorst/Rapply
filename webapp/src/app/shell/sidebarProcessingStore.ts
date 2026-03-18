import { useEffect, useState } from 'react'

export type SidebarProcessingKind = 'report' | 'document'
export type SidebarProcessingStatus = 'processing' | 'done'

export type SidebarProcessingStoreItem = {
  id: string
  label: string
  kind: SidebarProcessingKind
  status: SidebarProcessingStatus
  targetReportId?: string | null
}

type Listener = (items: SidebarProcessingStoreItem[]) => void

const listeners = new Set<Listener>()
let items: SidebarProcessingStoreItem[] = []

function notify() {
  const snapshot = [...items]
  for (const listener of listeners) {
    listener(snapshot)
  }
}

export function upsertSidebarProcessingItem(item: SidebarProcessingStoreItem) {
  const existingIndex = items.findIndex((current) => current.id === item.id)
  if (existingIndex >= 0) {
    items = items.map((current, index) => (index === existingIndex ? item : current))
  } else {
    items = [item, ...items]
  }
  notify()
}

export function markSidebarProcessingItemDone(id: string, options?: { targetReportId?: string | null }) {
  const existing = items.find((item) => item.id === id)
  if (!existing) return
  if (existing.status === 'done') return
  items = items.map((item) =>
    item.id === id
      ? {
          ...item,
          status: 'done',
          targetReportId: options?.targetReportId ?? item.targetReportId ?? null,
        }
      : item,
  )
  notify()
}

export function removeSidebarProcessingItem(id: string) {
  const nextItems = items.filter((item) => item.id !== id)
  if (nextItems.length === items.length) return
  items = nextItems
  notify()
}

export function useSidebarProcessingItems() {
  const [state, setState] = useState<SidebarProcessingStoreItem[]>(() => [...items])

  useEffect(() => {
    listeners.add(setState)
    setState([...items])
    return () => {
      listeners.delete(setState)
    }
  }, [])

  return state
}
