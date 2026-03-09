import type { Client } from "../../types/Client"

type PipedrivePerson = {
  id?: number | string
  name?: string
  email?: Array<{ value?: string }> | string
  phone?: Array<{ value?: string }> | string
  org_name?: string
}

function readListValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item && typeof item === "object" ? String((item as any).value || "").trim() : ""))
      .filter(Boolean)
  }
  const text = String(value || "").trim()
  return text ? [text] : []
}

export function mapPipedrivePersonToClient(params: {
  payload: Record<string, unknown>
  nowUnixMs: number
}): { externalId: string; client: Client } | null {
  const person = params.payload as PipedrivePerson
  const externalId = String(person.id || "").trim()
  const name = String(person.name || "").trim()
  if (!externalId || !name) return null

  const emails = readListValues(person.email)
  const phones = readListValues(person.phone)
  const organization = String(person.org_name || "").trim()
  const clientDetails = [emails.length ? `emails: ${emails.join(", ")}` : "", phones.length ? `phones: ${phones.join(", ")}` : ""]
    .filter(Boolean)
    .join("\n")
  const employerDetails = organization ? `organization: ${organization}` : ""

  return {
    externalId,
    client: {
      id: `pipedrive_person_${externalId}`,
      name,
      clientDetails,
      employerDetails,
      firstSickDay: "",
      createdAtUnixMs: params.nowUnixMs,
      updatedAtUnixMs: params.nowUnixMs,
      isArchived: false,
    },
  }
}
