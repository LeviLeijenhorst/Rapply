import { LocalAppData } from './types'

export function createDefaultLocalAppData(): LocalAppData {
  return {
    coachees: [],
    sessions: [],
    notes: [],
    writtenReports: [],
  }
}

