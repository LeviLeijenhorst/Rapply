import { getClientUpsertValues, type ClientUpsertValues } from '../../../types/clientProfile'

export function createInitialNewClientValues(): ClientUpsertValues {
  return getClientUpsertValues(null)
}

export function sanitizeNewClientValues(values: ClientUpsertValues): ClientUpsertValues {
  return {
    ...values,
    clientAddress: '',
    clientPostalCode: '',
    clientCity: '',
  }
}

export function isNewClientFormValid(values: ClientUpsertValues): boolean {
  return values.firstName.trim().length > 0 && values.lastName.trim().length > 0
}

