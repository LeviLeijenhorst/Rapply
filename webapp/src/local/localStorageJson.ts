type SafeJsonResult<T> =
  | { ok: true; value: T }
  | { ok: false }

export function readJsonFromLocalStorage<T>(key: string): SafeJsonResult<T> {
  if (typeof window === 'undefined') return { ok: false }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return { ok: false }
    return { ok: true, value: JSON.parse(raw) as T }
  } catch {
    return { ok: false }
  }
}

export function writeJsonToLocalStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

