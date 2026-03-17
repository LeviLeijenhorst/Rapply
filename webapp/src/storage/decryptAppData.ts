import type { JsonValue, LocalAppData, ReportFieldVersion, StructuredReport, StructuredReportField } from './types'

type TextDecryptor = {
  decryptText: (value: string) => Promise<string>
}

function looksEncryptedValue(value: string): boolean {
  const normalized = String(value || '').trim()
  if (normalized.length < 24) return false
  return /^[A-Za-z0-9+/_=-]+$/.test(normalized)
}

async function decryptTextIfNeeded(value: string, decryptor: TextDecryptor): Promise<string> {
  const raw = String(value || '')
  const trimmed = raw.trim()
  if (!trimmed) return raw
  if (!looksEncryptedValue(trimmed)) return raw
  try {
    return await decryptor.decryptText(trimmed)
  } catch {
    return raw
  }
}

async function decryptNullableTextIfNeeded(value: string | null, decryptor: TextDecryptor): Promise<string | null> {
  if (value === null) return null
  return decryptTextIfNeeded(value, decryptor)
}

async function decryptJsonValue(value: JsonValue, decryptor: TextDecryptor): Promise<JsonValue> {
  if (typeof value === 'string') return decryptTextIfNeeded(value, decryptor)
  if (value === null || typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) return Promise.all(value.map((item) => decryptJsonValue(item, decryptor)))
  const output: Record<string, JsonValue> = {}
  for (const [key, child] of Object.entries(value)) output[key] = await decryptJsonValue(child, decryptor)
  return output
}

async function decryptReportVersion(version: ReportFieldVersion, decryptor: TextDecryptor): Promise<ReportFieldVersion> {
  return {
    ...version,
    answer: await decryptJsonValue(version.answer, decryptor),
    factualBasis: await decryptTextIfNeeded(version.factualBasis, decryptor),
    reasoning: await decryptTextIfNeeded(version.reasoning, decryptor),
    prompt: await decryptNullableTextIfNeeded(version.prompt, decryptor),
  }
}

async function decryptReportField(field: StructuredReportField, decryptor: TextDecryptor): Promise<StructuredReportField> {
  return {
    ...field,
    label: await decryptTextIfNeeded(field.label, decryptor),
    answer: await decryptJsonValue(field.answer, decryptor),
    factualBasis: await decryptTextIfNeeded(field.factualBasis, decryptor),
    reasoning: await decryptTextIfNeeded(field.reasoning, decryptor),
    versions: await Promise.all(field.versions.map((version) => decryptReportVersion(version, decryptor))),
  }
}

async function decryptStructuredReport(
  report: StructuredReport | null,
  decryptor: TextDecryptor,
): Promise<StructuredReport | null> {
  if (!report) return null
  const nextFields: Record<string, StructuredReportField> = {}
  for (const [fieldId, field] of Object.entries(report.fields)) {
    nextFields[fieldId] = await decryptReportField(field, decryptor)
  }
  return {
    ...report,
    templateName: await decryptTextIfNeeded(report.templateName, decryptor),
    fields: nextFields,
  }
}

export async function decryptAppDataTextFields(data: LocalAppData, decryptor: TextDecryptor): Promise<LocalAppData> {
  return {
    ...data,
    clients: await Promise.all(
      data.clients.map(async (client) => ({
        ...client,
        name: await decryptTextIfNeeded(client.name, decryptor),
        clientDetails: await decryptTextIfNeeded(client.clientDetails, decryptor),
        employerDetails: await decryptTextIfNeeded(client.employerDetails, decryptor),
      })),
    ),
    trajectories: await Promise.all(
      data.trajectories.map(async (trajectory) => ({
        ...trajectory,
        name: await decryptTextIfNeeded(trajectory.name, decryptor),
        serviceType: await decryptNullableTextIfNeeded(trajectory.serviceType ?? null, decryptor),
        uwvContactName: await decryptNullableTextIfNeeded(trajectory.uwvContactName, decryptor),
        uwvContactPhone: await decryptNullableTextIfNeeded(trajectory.uwvContactPhone ?? null, decryptor),
        uwvContactEmail: await decryptNullableTextIfNeeded(trajectory.uwvContactEmail ?? null, decryptor),
        orderNumber: await decryptNullableTextIfNeeded(trajectory.orderNumber, decryptor),
      })),
    ),
    inputs: await Promise.all(
      data.inputs.map(async (input) => ({
        ...input,
        title: await decryptTextIfNeeded(input.title, decryptor),
        uploadFileName: await decryptNullableTextIfNeeded(input.uploadFileName, decryptor),
        transcript: await decryptNullableTextIfNeeded(input.transcript, decryptor),
        summary: await decryptNullableTextIfNeeded(input.summary, decryptor),
      })),
    ),
    reports: await Promise.all(
      data.reports.map(async (report) => ({
        ...report,
        title: await decryptTextIfNeeded(report.title, decryptor),
        reportText: await decryptTextIfNeeded(report.reportText, decryptor),
        reportStructuredJson: await decryptStructuredReport(report.reportStructuredJson, decryptor),
      })),
    ),
    snippets: await Promise.all(
      data.snippets.map(async (snippet) => ({
        ...snippet,
        text: await decryptTextIfNeeded(snippet.text, decryptor),
      })),
    ),
    notes: await Promise.all(
      data.notes.map(async (note) => ({
        ...note,
        title: await decryptTextIfNeeded(note.title, decryptor),
        text: await decryptTextIfNeeded(note.text, decryptor),
      })),
    ),
    organizationSettings: {
      ...data.organizationSettings,
      name: await decryptTextIfNeeded(data.organizationSettings.name, decryptor),
      practiceName: data.organizationSettings.practiceName
        ? await decryptTextIfNeeded(data.organizationSettings.practiceName, decryptor)
        : undefined,
      website: await decryptTextIfNeeded(data.organizationSettings.website, decryptor),
      visitAddress: await decryptTextIfNeeded(data.organizationSettings.visitAddress, decryptor),
      postalAddress: await decryptTextIfNeeded(data.organizationSettings.postalAddress, decryptor),
      postalCodeCity: await decryptTextIfNeeded(data.organizationSettings.postalCodeCity, decryptor),
      visitPostalCodeCity: data.organizationSettings.visitPostalCodeCity
        ? await decryptTextIfNeeded(data.organizationSettings.visitPostalCodeCity, decryptor)
        : undefined,
      contactName: data.organizationSettings.contactName
        ? await decryptTextIfNeeded(data.organizationSettings.contactName, decryptor)
        : undefined,
      contactRole: data.organizationSettings.contactRole
        ? await decryptTextIfNeeded(data.organizationSettings.contactRole, decryptor)
        : undefined,
      contactPhone: data.organizationSettings.contactPhone
        ? await decryptTextIfNeeded(data.organizationSettings.contactPhone, decryptor)
        : undefined,
      contactEmail: data.organizationSettings.contactEmail
        ? await decryptTextIfNeeded(data.organizationSettings.contactEmail, decryptor)
        : undefined,
    },
    userSettings: {
      ...data.userSettings,
      name: await decryptTextIfNeeded(data.userSettings.name, decryptor),
      role: await decryptTextIfNeeded(data.userSettings.role, decryptor),
      phone: await decryptTextIfNeeded(data.userSettings.phone, decryptor),
      email: await decryptTextIfNeeded(data.userSettings.email, decryptor),
    },
  }
}
