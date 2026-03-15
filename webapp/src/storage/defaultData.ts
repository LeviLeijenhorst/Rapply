import { LocalAppData } from './types'

export function createDefaultLocalAppData(): LocalAppData {
  return {
    clients: [],
    trajectories: [],
    inputs: [],
    reports: [],
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
      visitPostalCodeCity: '',
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
