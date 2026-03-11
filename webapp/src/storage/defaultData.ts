import { LocalAppData } from './types'

export function createDefaultLocalAppData(): LocalAppData {
  return {
    clients: [],
    trajectories: [],
    inputs: [],
    snippets: [],
    notes: [],
    templates: [],
    inputSummaries: [],
    organizationSettings: {
      name: '',
      website: '',
      visitAddress: '',
      postalAddress: '',
      postalCodeCity: '',
      tintColor: '#BE0165',
      logoDataUrl: null,
      contactName: '',
      contactRole: '',
      contactPhone: '',
      contactEmail: '',
      updatedAtUnixMs: 0,
    },
    userSettings: {
      name: '',
      role: '',
      phone: '',
      email: '',
      updatedAtUnixMs: 0,
    },
  }
}
