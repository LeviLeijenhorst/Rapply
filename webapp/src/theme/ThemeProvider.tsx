import React, { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { ThemeMode, colorTokens } from './colors'
import { readStoredThemeMode, writeStoredThemeMode } from './themeStorage'

type ThemeModeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)

type Props = {
  children: ReactNode
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const tokens = colorTokens[mode]
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(`--color-${key}`, value)
  }
}

function getInitialThemeMode(): ThemeMode {
  const stored = readStoredThemeMode()
  if (stored) return stored
  if (typeof window === 'undefined') return 'light'
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function ThemeProvider({ children }: Props) {
  const [mode, setMode] = useState<ThemeMode>(() => getInitialThemeMode())

  useEffect(() => {
    applyThemeMode(mode)
    writeStoredThemeMode(mode)
  }, [mode])

  const updateMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode)
  }, [])

  const toggleMode = useCallback(() => {
    setMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo<ThemeModeContextValue>(() => {
    return {
      mode,
      setMode: updateMode,
      toggleMode,
    }
  }, [mode, toggleMode, updateMode])

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode() {
  const value = useContext(ThemeModeContext)
  if (!value) {
    throw new Error('useThemeMode must be used within ThemeProvider')
  }
  return value
}
