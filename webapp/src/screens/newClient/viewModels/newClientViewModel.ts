import { getCoacheeUpsertValues, type CoacheeUpsertValues } from '../../../types/clientProfile'

export function createInitialNewClientValues(): CoacheeUpsertValues {
  return getCoacheeUpsertValues(null)
}

export function sanitizeNewClientValues(values: CoacheeUpsertValues): CoacheeUpsertValues {
  return {
    ...values,
    clientAddress: '',
    clientPostalCode: '',
    clientCity: '',
  }
}

export function isNewClientFormValid(values: CoacheeUpsertValues): boolean {
  return values.firstName.trim().length > 0 && values.lastName.trim().length > 0
}
