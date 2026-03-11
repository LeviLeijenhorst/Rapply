import { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

export function useCalendarMountTransition(isCalendarOpen: boolean, animationMs: number) {
  const [isCalendarMounted, setIsCalendarMounted] = useState(false)
  const [isCalendarActive, setIsCalendarActive] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    if (isCalendarOpen) {
      setIsCalendarMounted(true)
      const id = setTimeout(() => setIsCalendarActive(true), 8)
      return () => clearTimeout(id)
    }

    setIsCalendarActive(false)
    closeTimerRef.current = setTimeout(() => {
      setIsCalendarMounted(false)
      closeTimerRef.current = null
    }, animationMs)

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
    }
  }, [animationMs, isCalendarOpen])

  return { isCalendarMounted, isCalendarActive }
}

export function useCloseCalendarOnOutsidePointer(params: {
  isCalendarOpen: boolean
  calendarPanelRef: React.MutableRefObject<View | null>
  calendarButtonRef: React.MutableRefObject<View | null>
  onClose: () => void
}) {
  const { isCalendarOpen, calendarPanelRef, calendarButtonRef, onClose } = params

  useEffect(() => {
    if (!isCalendarOpen) return
    if (typeof window === 'undefined') return

    const pointInRect = (x: number, y: number, rect: DOMRect | null | undefined) => {
      if (!rect) return false
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
      const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return

      const panelRect = (calendarPanelRef.current as any)?.getBoundingClientRect?.() as DOMRect | undefined
      const buttonRect = (calendarButtonRef.current as any)?.getBoundingClientRect?.() as DOMRect | undefined
      if (pointInRect(clientX, clientY, panelRect) || pointInRect(clientX, clientY, buttonRect)) return

      onClose()
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [calendarButtonRef, calendarPanelRef, isCalendarOpen, onClose])
}
