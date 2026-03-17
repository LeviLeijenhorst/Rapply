export type RapportagePageMode = 'controleren' | 'bewerken'
export type InputTabKey = 'sessies' | 'rapportages' | 'notities'
export type ViewMode = 'setup' | 'edit'
export type MetadataKind = 'none' | 'name' | 'initials' | 'surname' | 'order' | 'bsn' | 'email' | 'phone' | 'months'
export type FieldType = 'text' | 'multichoice'

export type ReportScreenProps = {
  initialCoacheeId?: string | null
  initialSessionId?: string | null
  initialClientId?: string | null
  initialInputId?: string | null
  headerTitle?: string | null
  headerClientName?: string | null
  onBack?: () => void
  mode?: RapportagePageMode
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

