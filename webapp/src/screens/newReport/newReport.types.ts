export type InputTabKey = 'sessies' | 'rapportages' | 'notities'
export type ViewMode = 'setup' | 'edit'
export type RapportagePageMode = 'controleren' | 'bewerken'
export type MetadataKind = 'none' | 'name' | 'initials' | 'surname' | 'order' | 'bsn' | 'email' | 'phone' | 'months'
export type FieldType = 'text' | 'multichoice'

export type NewReportScreenProps = {
  initialCoacheeId?: string | null
  initialSessionId?: string | null
  initialClientId?: string | null
  initialInputId?: string | null
  mode?: RapportagePageMode
  onBack?: () => void
}

export type InputRow = {
  id: string
  title: string
  dateLabel: string
  createdAtUnixMs: number
}

export type UwvField = {
  key: string
  rawLabel: string
  label: string
  numberPrefix: string
  metadataKind: MetadataKind
  singleLine: boolean
  type: FieldType
  options?: string[]
}

export type UwvFieldGroup = {
  key: string
  title: string
  fields: UwvField[]
}

export type ActivityAllocationRow = {
  id: string
  activity: string
  hours: string
}

export type ReportInputField = {
  key: string
  label: string
  rawLabel: string
}

export type ReportFieldGroup = {
  title: string
  fields: ReportInputField[]
}
