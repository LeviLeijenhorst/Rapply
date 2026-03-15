import assert from 'node:assert/strict'
import test from 'node:test'

import { loadLocalAppData } from './localAppDataStore'

const storageKey = 'coachscribe.localAppData.v4'

type LocalStorageLike = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  key: (index: number) => string | null
  readonly length: number
}

function createLocalStorageStub(initial: Record<string, string> = {}): LocalStorageLike {
  const store = new Map<string, string>(Object.entries(initial))
  return {
    getItem: (key) => (store.has(key) ? store.get(key) ?? null : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    },
  }
}

test('loadLocalAppData keeps input.summaryStructured after reload normalization', () => {
  const originalWindow = (globalThis as { window?: unknown }).window
  const localStorage = createLocalStorageStub()
  ;(globalThis as { window: { localStorage: LocalStorageLike } }).window = { localStorage }

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        clients: [],
        trajectories: [],
        inputs: [
          {
            id: 'input-1',
            clientId: 'client-1',
            trajectoryId: 'trajectory-1',
            title: 'Opname',
            type: 'recorded-session',
            createdAtUnixMs: 1,
            updatedAtUnixMs: 1,
            transcript: 'Transcript',
            summary: null,
            summaryStructured: {
              doelstelling: 'Kernpunt',
              belastbaarheid: '',
              belemmeringen: '',
              voortgang: '',
              arbeidsmarktorientatie: '',
            },
            transcriptionStatus: 'done',
            transcriptionError: null,
          },
        ],
        reports: [],
        snippets: [],
        notes: [],
        templates: [],
        inputSummaries: [],
        organizationSettings: {
          name: '',
          practiceName: '',
          website: '',
          visitAddress: '',
          postalAddress: '',
          postalCodeCity: '',
          updatedAtUnixMs: 1,
        },
        userSettings: {
          name: '',
          role: '',
          phone: '',
          email: '',
          updatedAtUnixMs: 1,
        },
      }),
    )

    const data = loadLocalAppData()
    assert.equal(data.inputs.length, 1)
    assert.deepEqual(data.inputs[0].summaryStructured, {
      doelstelling: 'Kernpunt',
      belastbaarheid: '',
      belemmeringen: '',
      voortgang: '',
      arbeidsmarktorientatie: '',
    })
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window
    } else {
      ;(globalThis as { window: unknown }).window = originalWindow
    }
  }
})
