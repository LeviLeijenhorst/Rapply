import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { BottomToast } from '../ui/BottomToast'
import { sanitizeUserFacingErrorMessage } from '../types/userFriendlyError'

type ToastApi = {
  showToast: (message: string) => void
  showErrorToast: (message: string, fallback?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

type Props = {
  children: React.ReactNode
}

export function ToastProvider({ children }: Props) {
  const [toastMessage, setToastMessage] = useState('')
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [isToastHovered, setIsToastHovered] = useState(false)

  const showToast = useCallback((message: string) => {
    const trimmed = String(message || '').trim()
    if (!trimmed) return
    setToastMessage(trimmed)
    setIsToastVisible(false)
    setIsToastHovered(false)
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => setIsToastVisible(true))
      return
    }
    setIsToastVisible(true)
  }, [])

  const showErrorToast = useCallback((message: string, fallback = 'Er ging iets mis. Probeer het opnieuw.') => {
    showToast(sanitizeUserFacingErrorMessage(message, fallback))
  }, [showToast])

  useEffect(() => {
    if (!isToastVisible || isToastHovered) return
    const timeout = setTimeout(() => setIsToastVisible(false), 2600)
    return () => clearTimeout(timeout)
  }, [isToastHovered, isToastVisible])

  const value = useMemo<ToastApi>(() => ({ showToast, showErrorToast }), [showErrorToast, showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <BottomToast
        visible={isToastVisible}
        message={toastMessage}
        onHoverStart={() => setIsToastHovered(true)}
        onHoverEnd={() => setIsToastHovered(false)}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
