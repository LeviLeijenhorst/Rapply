import type { Client as ClientRecord } from '../storage/types'

export type ClientUpsertValues = {
  firstName: string
  initials: string
  lastName: string
  bsn: string
  trajectoryId: string
  orderNumber: string
  uwvContactName: string
  clientEmail: string
  clientPhone: string
  clientAddress: string
  clientPostalCode: string
  clientCity: string
  employerName: string
  employerContactName: string
  employerEmail: string
  employerPhone: string
  firstSickDay: string
}

type ParsedClientDetails = {
  firstName?: string
  initials?: string
  lastName?: string
  bsn?: string
  trajectoryId?: string
  email?: string
  phone?: string
  address?: string
  postalCode?: string
  city?: string
}

type ParsedEmployerDetails = {
  organizationName?: string
  contactName?: string
  email?: string
  phone?: string
}

function parseJsonObject<T>(value: string | null | undefined): T | null {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as T
  } catch {
    return null
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim()
  if (!trimmed) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = trimmed.split(/\s+/)
  return { firstName, lastName: rest.join(' ') }
}

export function getClientUpsertValues(client: ClientRecord | null | undefined): ClientUpsertValues {
  if (!client) {
    return {
      firstName: '',
      initials: '',
      lastName: '',
      bsn: '',
      trajectoryId: '',
      orderNumber: '',
      uwvContactName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      clientPostalCode: '',
      clientCity: '',
      employerName: '',
      employerContactName: '',
      employerEmail: '',
      employerPhone: '',
      firstSickDay: '',
    }
  }

  const split = splitName(client.name)
  const clientDetails = parseJsonObject<ParsedClientDetails>(client.clientDetails)
  const employerDetails = parseJsonObject<ParsedEmployerDetails>(client.employerDetails)

  return {
    firstName: String(clientDetails?.firstName ?? split.firstName ?? '').trim(),
    initials: String(clientDetails?.initials ?? '').trim(),
    lastName: String(clientDetails?.lastName ?? split.lastName ?? '').trim(),
    bsn: String(clientDetails?.bsn ?? '').trim(),
    trajectoryId: String(clientDetails?.trajectoryId ?? '').trim(),
    orderNumber: '',
    uwvContactName: '',
    clientEmail: String(clientDetails?.email ?? '').trim(),
    clientPhone: String(clientDetails?.phone ?? '').trim(),
    clientAddress: String(clientDetails?.address ?? '').trim(),
    clientPostalCode: String(clientDetails?.postalCode ?? '').trim(),
    clientCity: String(clientDetails?.city ?? '').trim(),
    employerName: String(employerDetails?.organizationName ?? '').trim(),
    employerContactName: String(employerDetails?.contactName ?? '').trim(),
    employerEmail: String(employerDetails?.email ?? '').trim(),
    employerPhone: String(employerDetails?.phone ?? '').trim(),
    firstSickDay: String((client as any).firstSickDay ?? '').trim(),
  }
}

export const getCoacheeUpsertValues = getClientUpsertValues
export type CoacheeUpsertValues = ClientUpsertValues

export function serializeClientUpsertValues(values: ClientUpsertValues): {
  name: string
  clientDetails: string
  employerDetails: string
  firstSickDay: string
} {
  const firstName = values.firstName.trim()
  const initials = values.initials.trim()
  const lastName = values.lastName.trim()
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()

  const clientDetails = JSON.stringify({
    firstName,
    initials,
    lastName,
    bsn: values.bsn.trim(),
    trajectoryId: values.trajectoryId.trim(),
    email: values.clientEmail.trim(),
    phone: values.clientPhone.trim(),
    address: values.clientAddress.trim(),
    postalCode: values.clientPostalCode.trim(),
    city: values.clientCity.trim(),
  })

  const employerDetails = JSON.stringify({
    organizationName: values.employerName.trim(),
    contactName: values.employerContactName.trim(),
    email: values.employerEmail.trim(),
    phone: values.employerPhone.trim(),
  })

  return {
    name,
    clientDetails,
    employerDetails,
    firstSickDay: values.firstSickDay.trim(),
  }
}

export const serializeCoacheeUpsertValues = serializeClientUpsertValues

export function formatClientDetailsForPrompt(clientDetailsRaw: string | null | undefined): string[] {
  const details = parseJsonObject<ParsedClientDetails>(clientDetailsRaw)
  if (!details) return []
  const lines: string[] = []
  const fullName = [String(details.initials ?? '').trim(), String(details.lastName ?? '').trim()].filter(Boolean).join(' ')
  if (fullName) lines.push(`Naam client: ${fullName}`)
  if (String(details.bsn ?? '').trim()) lines.push(`BSN client: ${String(details.bsn ?? '').trim()}`)
  if (String(details.email ?? '').trim()) lines.push(`E-mail client: ${String(details.email ?? '').trim()}`)
  if (String(details.phone ?? '').trim()) lines.push(`Telefoon client: ${String(details.phone ?? '').trim()}`)
  if (String(details.address ?? '').trim()) lines.push(`Adres client: ${String(details.address ?? '').trim()}`)
  if (String(details.postalCode ?? '').trim()) lines.push(`Postcode client: ${String(details.postalCode ?? '').trim()}`)
  if (String(details.city ?? '').trim()) lines.push(`Woonplaats client: ${String(details.city ?? '').trim()}`)
  return lines
}
export const formatCoacheeDetailsForPrompt = formatClientDetailsForPrompt

export function formatEmployerDetailsForPrompt(employerDetailsRaw: string | null | undefined): string[] {
  const details = parseJsonObject<ParsedEmployerDetails>(employerDetailsRaw)
  if (!details) return []
  const lines: string[] = []
  if (String(details.organizationName ?? '').trim()) lines.push(`Werkgever: ${String(details.organizationName ?? '').trim()}`)
  if (String(details.contactName ?? '').trim()) lines.push(`Contactpersoon werkgever: ${String(details.contactName ?? '').trim()}`)
  if (String(details.email ?? '').trim()) lines.push(`E-mail werkgever: ${String(details.email ?? '').trim()}`)
  if (String(details.phone ?? '').trim()) lines.push(`Telefoon werkgever: ${String(details.phone ?? '').trim()}`)
  return lines
}
