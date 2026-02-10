import { LocalAppData } from './types'

export function createDefaultLocalAppData(): LocalAppData {
  return {
    coachees: [],
    sessions: [],
    notes: [],
    writtenReports: [],
    templates: [],
    practiceSettings: {
      practiceName: '',
      website: '',
      tintColor: '#BE0165',
      logoDataUrl: null,
      updatedAtUnixMs: 0,
    },
  }
}
