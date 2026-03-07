import { LocalAppData } from './types'

export function createDefaultLocalAppData(): LocalAppData {
  return {
    coachees: [],
    trajectories: [],
    sessions: [],
    activities: [],
    activityTemplates: [],
    snippets: [],
    notes: [],
    writtenReports: [],
    templates: [],
    practiceSettings: {
      practiceName: '',
      website: '',
      visitAddress: '',
      postalAddress: '',
      postalCodeCity: '',
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactEmail: '',
      tintColor: '#BE0165',
      logoDataUrl: null,
      updatedAtUnixMs: 0,
    },
  }
}
