import { buildStructuredReportMarkdown } from '../../types/reportGeneration'
import { normalizeTranscriptionError } from '../../audio/processing/transcriptionError'
import { exportReportToWord } from '../../api/reports/exportReportToWord'
import { fetchCurrentUserProfile } from '../../api/account/accountApi'
import type { Activity, Coachee, Session, StructuredSessionSummary, Template, Trajectory } from '../../storage/types'

type CoacheeProfileValues = {
  initials: string
  lastName: string
  bsn: string
}

type OrganizationPostal = {
  postalCode: string
  city: string
}

type Params = {
  activeTrajectoryForSession: Trajectory | null
  adminExecutedHours: number
  coachee: Coachee | null
  coacheeProfileValues: CoacheeProfileValues
  data: {
    sessions: Session[]
    practiceSettings: {
      practiceName: string
      visitAddress: string
      postalAddress: string
      postalCodeCity: string
      contactName: string
      contactRole: string
      contactPhone: string
      contactEmail: string
    }
  }
  editableCoacheeName: string
  editableSessionTitle: string
  isRapportageOnlyView: boolean
  isWrittenSession: boolean
  missingGenerateMessage: string
  missingSourceReportsMessage: string
  orderNumberForExport: string
  organizationPostal: OrganizationPostal
  plannedActivitiesForTrajectory: Activity[]
  reportText: string
  selectedTemplate: Template | null
  session: Session | null
  sessionId: string
  setForcedTranscriptionStatus: (status: 'transcribing' | 'generating' | null) => void
  setWrittenReport: (sessionId: string, text: string) => void
  showErrorToast: (message: string, description?: string) => void
  totalExecutedHours: number
  updateSession: (sessionId: string, patch: Partial<Session>) => void
  executedActivitiesForTrajectory: Activity[]
}

function normalizeTemplateMatchValue(value: string): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function createSessieDetailReportActions({
  activeTrajectoryForSession,
  adminExecutedHours,
  coachee,
  coacheeProfileValues,
  data,
  editableCoacheeName,
  editableSessionTitle,
  isRapportageOnlyView,
  isWrittenSession,
  missingGenerateMessage,
  missingSourceReportsMessage,
  orderNumberForExport,
  organizationPostal,
  plannedActivitiesForTrajectory,
  reportText,
  selectedTemplate,
  session,
  sessionId,
  setForcedTranscriptionStatus,
  setWrittenReport,
  showErrorToast,
  totalExecutedHours,
  updateSession,
  executedActivitiesForTrajectory,
}: Params) {
  async function handleExportSummaryAsWord() {
    if (!isRapportageOnlyView) {
      return { mode: 'editor' as const }
    }
    try {
      let exportContactName = String(data.practiceSettings.contactName || '').trim()
      if (!exportContactName) {
        try {
          const me = await fetchCurrentUserProfile()
          exportContactName =
            [String(me?.givenName || '').trim(), String(me?.surname || '').trim()].filter(Boolean).join(' ').trim() ||
            String(me?.name || '').trim() ||
            String(me?.displayName || '').trim() ||
            String(me?.email || '').split('@')[0].trim()
        } catch {
          // Best effort fallback; keep empty when user profile cannot be resolved.
        }
      }

      const exportTrajectory = activeTrajectoryForSession
      const trajectoryOrderNumber = String(exportTrajectory?.orderNumber || '').trim() || orderNumberForExport
      const trajectoryUwvContactName = String(exportTrajectory?.uwvContactName || '').trim()
      const trajectoryStartDate = String(exportTrajectory?.startDate || '').trim()
      const normalizedExportTemplateName = normalizeTemplateMatchValue(selectedTemplate?.name ?? editableSessionTitle)
      const isReintegratieplanTemplate =
        normalizedExportTemplateName.includes('re integratieplan') && normalizedExportTemplateName.includes('werkfit')
      const isEindrapportageTemplate =
        normalizedExportTemplateName.includes('eindrapportage') && normalizedExportTemplateName.includes('werkfit')

      const plannedActivityLines = plannedActivitiesForTrajectory.map((activity, index) => {
        const hours = Number.isFinite(Number(activity.plannedHours)) ? Number(activity.plannedHours) : 0
        return `${index + 1}. ${activity.name} (${activity.category}) - ${hours} uur`
      })
      const plannedActivityContext: Record<string, string> = {}
      for (let index = 0; index < plannedActivitiesForTrajectory.length; index += 1) {
        const activity = plannedActivitiesForTrajectory[index]
        const hours = Number.isFinite(Number(activity.plannedHours)) ? Number(activity.plannedHours) : 0
        plannedActivityContext[`5_${index + 1}`] = `${activity.name} (${activity.category}) - ${hours} uur`
      }

      const executedActivityLines = executedActivitiesForTrajectory.map((activity, index) => {
        const hours = Number.isFinite(Number(activity.actualHours)) ? Number(activity.actualHours) : 0
        return `${index + 1}. ${activity.name} (${activity.category}) - ${hours} uur`
      })
      const executedActivityContext: Record<string, string> = {}
      for (let index = 0; index < executedActivitiesForTrajectory.length; index += 1) {
        const activity = executedActivitiesForTrajectory[index]
        const hours = Number.isFinite(Number(activity.actualHours)) ? Number(activity.actualHours) : 0
        executedActivityContext[`7_${index + 1}`] = `${activity.name} (${activity.category}) - ${hours} uur`
      }

      if (isEindrapportageTemplate && exportTrajectory) {
        if (adminExecutedHours > exportTrajectory.maxAdminHours) {
          showErrorToast(
            `Administratieve uitgevoerde uren (${adminExecutedHours}) overschrijden het maximum (${exportTrajectory.maxAdminHours}).`,
          )
          return { mode: 'handled' as const }
        }
        if (totalExecutedHours > exportTrajectory.maxHours) {
          showErrorToast(
            `Totaal uitgevoerde uren (${totalExecutedHours}) overschrijden het maximum (${exportTrajectory.maxHours}).`,
          )
          return { mode: 'handled' as const }
        }
      }

      const didExportTemplate = await exportReportToWord({
        templateName: selectedTemplate?.name ?? editableSessionTitle,
        reportText,
        contextValues: {
          report_text: reportText,
          voorletters_en_achternaam: [coacheeProfileValues.initials, coacheeProfileValues.lastName].filter(Boolean).join(' ') || editableCoacheeName,
          burgerservicenummer: coacheeProfileValues.bsn,
          bsn: coacheeProfileValues.bsn,
          ordernummer: trajectoryOrderNumber,
          order_number: trajectoryOrderNumber,
          startdatum: trajectoryStartDate,
          start_date: trajectoryStartDate,
          planned_activities: isReintegratieplanTemplate ? plannedActivityLines.join('\n') : '',
          activiteitenoverzicht: isReintegratieplanTemplate ? plannedActivityLines.join('\n') : '',
          aantal_geplande_activiteiten: String(plannedActivitiesForTrajectory.length),
          executed_activities: isEindrapportageTemplate ? executedActivityLines.join('\n') : '',
          uitgevoerde_activiteiten: isEindrapportageTemplate ? executedActivityLines.join('\n') : '',
          aantal_uitgevoerde_activiteiten: String(executedActivitiesForTrajectory.length),
          totaal_uitgevoerde_uren: String(totalExecutedHours),
          totaal_admin_uren: String(adminExecutedHours),
          '1_2': coacheeProfileValues.bsn,
          '2_1': trajectoryUwvContactName,
          '4_1': trajectoryOrderNumber,
          '4_2': trajectoryStartDate,
          naam_organisatie: data.practiceSettings.practiceName,
          bezoekadres: data.practiceSettings.visitAddress,
          postadres: data.practiceSettings.postalAddress || data.practiceSettings.visitAddress,
          postcode_en_plaats: data.practiceSettings.postalCodeCity,
          postcode: organizationPostal.postalCode,
          plaats: organizationPostal.city,
          naam_contactpersoon: exportContactName,
          functie_contactpersoon: data.practiceSettings.contactRole,
          telefoonnummer_contactpersoon: data.practiceSettings.contactPhone,
          e_mailadres_contactpersoon: data.practiceSettings.contactEmail,
          ...plannedActivityContext,
          ...executedActivityContext,
        },
      })
      if (!didExportTemplate) {
        showErrorToast('Geen UWV-formulier gekoppeld aan dit rapporttype.', 'Geen UWV-formulier gekoppeld aan dit rapporttype.')
      }
      return { mode: 'handled' as const }
    } catch (error) {
      console.error('[SessieDetailScreen] UWV Word export failed', error)
      showErrorToast('Het UWV-formulier kon niet worden geëxporteerd.', 'Het UWV-formulier kon niet worden geëxporteerd.')
      return { mode: 'handled' as const }
    }
  }

  async function generateReportForTemplate(_templateId: string) {
    if (!session) return
    if (!session.coacheeId && !activeTrajectoryForSession) {
      showErrorToast(missingGenerateMessage, missingGenerateMessage)
      return
    }
    try {
      const relatedItems = data.sessions
        .filter((item) => item.id !== sessionId)
        .filter((item) => {
          if (activeTrajectoryForSession?.id) return item.trajectoryId === activeTrajectoryForSession.id
          return item.coacheeId === session.coacheeId
        })
        .sort((a, b) => a.createdAtUnixMs - b.createdAtUnixMs)
        .map((item) => ({
          id: item.id,
          title: String(item.title || 'Item').trim() || 'Item',
          createdAtUnixMs: item.createdAtUnixMs,
          summaryStructured: item.summaryStructured ?? null,
          legacySummary: item.summary ?? null,
        }))

      const reportMarkdown = buildStructuredReportMarkdown({
        coachee,
        trajectory: activeTrajectoryForSession,
        activities: [...plannedActivitiesForTrajectory, ...executedActivitiesForTrajectory],
        items: relatedItems,
      })
      if (!reportMarkdown) {
        showErrorToast(missingSourceReportsMessage, missingSourceReportsMessage)
        return
      }

      if (isWrittenSession) {
        setWrittenReport(sessionId, reportMarkdown)
        updateSession(sessionId, {
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      } else {
        updateSession(sessionId, {
          summary: reportMarkdown,
          summaryStructured: null,
          transcriptionStatus: 'done',
          transcriptionError: null,
        })
      }
      setForcedTranscriptionStatus(null)
    } catch (error) {
      console.error('[SessieDetailScreen] Report generation failed', error)
      updateSession(sessionId, {
        transcriptionStatus: 'error',
        transcriptionError: normalizeTranscriptionError(error),
      })
      setForcedTranscriptionStatus(null)
    }
  }

  return {
    generateReportForTemplate,
    handleExportSummaryAsWord,
  }
}





