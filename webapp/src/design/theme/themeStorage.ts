import { readJsonFromLocalStorage, writeJsonToLocalStorage } from '../../storage/localStorageJson'

import { ThemeMode } from './colors'

const storageKey = 'coachscribe.themeMode.v1'

export function readStoredThemeMode(): ThemeMode | null {
  const stored = readJsonFromLocalStorage<ThemeMode>(storageKey)
  if (!stored.ok) return null
  if (stored.value === 'light' || stored.value === 'dark') return stored.value
  return null
}

export function writeStoredThemeMode(mode: ThemeMode) {
  writeJsonToLocalStorage(storageKey, mode)
}

