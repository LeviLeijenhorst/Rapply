import type { Activity, Coachee, Session, Trajectory } from '../local/types'
import { formatCoacheeDetailsForPrompt, formatEmployerDetailsForPrompt } from './coacheeProfile'
import { hasStructuredSummaryContent, legacySummaryFallbackTitle, structuredSummaryFieldOrder, type StructuredSessionSummary } from './structuredSummary'

function formatDateLabel(unixMs: number): string {
  return new Intl.DateTimeFormat('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(unixMs))
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value % 1) < 0.001) return String(Math.round(value))
  return String(Math.round(value * 100) / 100)
}

export function buildStructuredReportMarkdown(params: {
  coachee: Coachee | null
  trajectory: Trajectory | null
  activities: Activity[]
  items: Array<{
    id: string
    title: string
    createdAtUnixMs: number
    summaryStructured: StructuredSessionSummary | null
    legacySummary: string | null
  }>
}): string {
  const lines: string[] = []
  const coacheeName = String(params.coachee?.name || '').trim()

  lines.push('### Cli\u00ebntmetadata')
  lines.push(coacheeName ? `Naam: ${coacheeName}` : '')
  const clientLines = formatCoacheeDetailsForPrompt(params.coachee?.clientDetails)
  const employerLines = formatEmployerDetailsForPrompt(params.coachee?.employerDetails)
  for (const line of [...clientLines, ...employerLines]) {
    lines.push(line)
  }

  lines.push('', '### Trajectmetadata')
  if (params.trajectory) {
    lines.push(`Naam traject: ${params.trajectory.name}`)
    lines.push(`Diensttype: ${params.trajectory.dienstType}`)
    if (params.trajectory.startDate) lines.push(`Startdatum: ${params.trajectory.startDate}`)
    if (params.trajectory.orderNumber) lines.push(`Ordernummer: ${params.trajectory.orderNumber}`)
    if (params.trajectory.uwvContactName) lines.push(`Naam contactpersoon UWV: ${params.trajectory.uwvContactName}`)
  } else {
    lines.push('Geen trajectmetadata beschikbaar.')
  }

  lines.push('', '### Activiteiten (uren)')
  const sortedActivities = params.activities.slice().sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
  if (sortedActivities.length === 0) {
    lines.push('Geen activiteiten geregistreerd.')
  } else {
    for (const activity of sortedActivities) {
      const hours = activity.status === 'executed' ? Number(activity.actualHours ?? 0) : Number(activity.plannedHours ?? 0)
      lines.push(`${activity.name} (${activity.category}) - ${formatNumber(hours)} uur`)
    }
  }

  const sortedItems = params.items.slice().sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
  for (const item of sortedItems) {
    const normalizedLegacy = String(item.legacySummary || '').trim()
    const hasStructured = hasStructuredSummaryContent(item.summaryStructured)
    if (!hasStructured && !normalizedLegacy) continue
    lines.push('', `### Item ${formatDateLabel(item.createdAtUnixMs)} - ${item.title}`)
    if (hasStructured && item.summaryStructured) {
      for (const field of structuredSummaryFieldOrder) {
        const content = String(item.summaryStructured[field.key] || '').trim()
        if (!content) continue
        lines.push(`${field.label}: ${content}`)
      }
    } else {
      lines.push(`${legacySummaryFallbackTitle}: ${normalizedLegacy}`)
    }
  }

  lines.push('', '### Ondertekening')
  lines.push('Naam contactpersoon re-integratiebedrijf')
  lines.push('Datum')

  return lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}


