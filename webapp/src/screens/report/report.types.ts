export type RapportagePageMode = 'controleren' | 'bewerken'

export type ReportScreenProps = {
  initialCoacheeId?: string | null
  initialSessionId?: string | null
  mode?: RapportagePageMode
}
