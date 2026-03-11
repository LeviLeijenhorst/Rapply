import { useEffect, useMemo, useState } from 'react'

import {
  buildFieldsFromTemplate,
  formatDateLabel,
  getGroupTitle,
  isSpecialistTariffQuestion,
  isWerkfitTemplate,
  normalizeMatchValue,
  normalizeNewReportScreenProps,
  normalizeYesNo,
} from '@/screens/newReport/newReport.logic'
import { isInputNotesArtifact, isInputPrimaryInputArtifact, isInputReportArtifact } from '@/types/sessionArtifacts'
import type {
  ActivityAllocationRow,
  InputRow,
  InputTabKey,
  NewReportScreenProps,
  UwvField,
  UwvFieldGroup,
  ViewMode,
} from '@/screens/newReport/newReport.types'

export function useNewReportScreenProps(props: NewReportScreenProps) {
  return useMemo(
    () => normalizeNewReportScreenProps(props),
    [props.initialCoacheeId, props.initialSessionId, props.initialClientId, props.initialInputId, props.mode],
  )
}

export function useNewReportScreenState(params: {
  data: any
  initialCoacheeId: string | null
  initialSessionId: string | null
}) {
  const { data, initialCoacheeId, initialSessionId } = params

  const initialSessionReportText = useMemo(
    () => (initialSessionId ? data.writtenReports.find((item: any) => item.sessionId === initialSessionId)?.text ?? '' : ''),
    [data.writtenReports, initialSessionId],
  )

  const [viewMode, setViewMode] = useState<ViewMode>(initialSessionId ? 'edit' : 'setup')
  const [activeTab, setActiveTab] = useState<InputTabKey>('sessies')
  const [assistantMessage, setAssistantMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [generatedReportText, setGeneratedReportText] = useState(initialSessionReportText)
  const [currentReportSessionId, setCurrentReportSessionId] = useState<string | null>(initialSessionId)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [selectedRapportageIds, setSelectedRapportageIds] = useState<string[]>([])
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [activityAllocationRows, setActivityAllocationRows] = useState<ActivityAllocationRow[]>([{ id: 'row-1', activity: '', hours: '' }])
  const [specialistExpertiseByField, setSpecialistExpertiseByField] = useState<Record<string, { hours: string; motivation: string }>>({})
  const [specialistTariffByField, setSpecialistTariffByField] = useState<Record<string, { hourlyRate: string; motivation: string }>>({})
  const [inputHeights, setInputHeights] = useState<Record<string, number>>({})
  const [assistantMessages, setAssistantMessages] = useState<any[]>([])
  const [isAssistantSending, setIsAssistantSending] = useState(false)

  const activeCoachees = useMemo(() => data.coachees.filter((item: any) => !item.isArchived), [data.coachees])
  const selectedCoachee = useMemo(() => {
    if (initialCoacheeId) {
      const byId = activeCoachees.find((item: any) => item.id === initialCoacheeId) ?? null
      if (byId) return byId
    }
    return activeCoachees[0] ?? null
  }, [activeCoachees, initialCoacheeId])

  const selectedTrajectory = useMemo(() => {
    if (!selectedCoachee) return null
    return data.trajectories.find((item: any) => item.coacheeId === selectedCoachee.id) ?? null
  }, [data.trajectories, selectedCoachee])

  const sessionRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    return data.sessions
      .filter((session: any) => session.coacheeId === selectedCoachee.id && isInputPrimaryInputArtifact(session))
      .map((session: any) => ({ id: session.id, title: String(session.title || '').trim() || 'Sessie', dateLabel: formatDateLabel(session.createdAtUnixMs), createdAtUnixMs: session.createdAtUnixMs }))
      .sort((a: any, b: any) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.sessions, selectedCoachee])

  const rapportageRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    return data.sessions
      .filter((session: any) => session.coacheeId === selectedCoachee.id && isInputReportArtifact(session))
      .map((session: any) => ({ id: session.id, title: String(session.title || '').trim() || 'Rapportage', dateLabel: formatDateLabel(session.createdAtUnixMs), createdAtUnixMs: session.createdAtUnixMs }))
      .sort((a: any, b: any) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.sessions, selectedCoachee])

  const noteRows = useMemo<InputRow[]>(() => {
    if (!selectedCoachee) return []
    const notesSessionIds = new Set(
      data.sessions
        .filter((session: any) => session.coacheeId === selectedCoachee.id && isInputNotesArtifact(session))
        .map((session: any) => session.id),
    )
    if (notesSessionIds.size === 0) return []
    return data.notes
      .filter((note: any) => notesSessionIds.has(note.sessionId))
      .map((note: any) => ({ id: note.id, title: String(note.title || '').trim() || String(note.text || '').trim().split('\n')[0] || 'Notitie', dateLabel: formatDateLabel(note.updatedAtUnixMs), createdAtUnixMs: note.updatedAtUnixMs }))
      .sort((a: any, b: any) => b.createdAtUnixMs - a.createdAtUnixMs)
  }, [data.notes, data.sessions, selectedCoachee])

  const werkfitTemplates = useMemo(() => data.templates.filter((template: any) => isWerkfitTemplate(template)).slice(0, 2), [data.templates])
  const selectedTemplate = useMemo(() => werkfitTemplates.find((template: any) => template.id === selectedTemplateId) ?? null, [selectedTemplateId, werkfitTemplates])
  const uwvFields = useMemo(() => buildFieldsFromTemplate(selectedTemplate), [selectedTemplate])

  const groupedFields = useMemo<UwvFieldGroup[]>(() => {
    if (!selectedTemplate?.name || uwvFields.length === 0) return []
    const groupMap = new Map<string, UwvFieldGroup>()
    for (const field of uwvFields) {
      const group = groupMap.get(field.numberPrefix)
      if (group) group.fields.push(field)
      else groupMap.set(field.numberPrefix, { key: field.numberPrefix, title: getGroupTitle(selectedTemplate.name, field.numberPrefix), fields: [field] })
    }
    return Array.from(groupMap.values()).sort((a, b) => Number(a.key) - Number(b.key))
  }, [selectedTemplate?.name, uwvFields])

  const specialistTariffAnswerByGroup = useMemo(() => {
    const answerByGroup = new Map<string, 'ja' | 'nee' | ''>()
    for (const group of groupedFields) {
      const tariffField = group.fields.find((field: UwvField) => isSpecialistTariffQuestion(field.label))
      if (!tariffField) continue
      answerByGroup.set(group.key, normalizeYesNo(fieldValues[tariffField.key] || ''))
    }
    return answerByGroup
  }, [fieldValues, groupedFields])

  useEffect(() => {
    if (werkfitTemplates.length === 0) {
      setSelectedTemplateId(null)
      return
    }
    setSelectedTemplateId((current) => (current && werkfitTemplates.some((template: any) => template.id === current) ? current : null))
  }, [werkfitTemplates])

  useEffect(() => {
    if (!initialSessionId) return
    setViewMode('edit')
    setGeneratedReportText(initialSessionReportText)
    setCurrentReportSessionId(initialSessionId)
  }, [initialSessionId, initialSessionReportText])

  useEffect(() => {
    if (!initialSessionId || werkfitTemplates.length === 0) return
    const initialSession = data.sessions.find((item: any) => item.id === initialSessionId) ?? null
    if (!initialSession) return
    const normalizedSessionTitle = normalizeMatchValue(String(initialSession.title || ''))
    const matchedTemplate = werkfitTemplates.find((template: any) => normalizeMatchValue(template.name) === normalizedSessionTitle)
    if (!matchedTemplate) return
    setSelectedTemplateId(matchedTemplate.id)
  }, [data.sessions, initialSessionId, werkfitTemplates])

  useEffect(() => {
    setSelectedSessionIds((current) => {
      if (current.length === 0) return sessionRows.map((item) => item.id)
      const validIds = new Set(sessionRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? sessionRows.map((item) => item.id) : next
    })
  }, [sessionRows])

  useEffect(() => {
    setSelectedRapportageIds((current) => {
      if (current.length === 0) return rapportageRows.map((item) => item.id)
      const validIds = new Set(rapportageRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? rapportageRows.map((item) => item.id) : next
    })
  }, [rapportageRows])

  useEffect(() => {
    setSelectedNoteIds((current) => {
      if (current.length === 0) return noteRows.map((item) => item.id)
      const validIds = new Set(noteRows.map((item) => item.id))
      const next = current.filter((id) => validIds.has(id))
      return next.length === 0 ? noteRows.map((item) => item.id) : next
    })
  }, [noteRows])

  const activeRows = activeTab === 'sessies' ? sessionRows : activeTab === 'rapportages' ? rapportageRows : noteRows
  const activeSelectedIds =
    activeTab === 'sessies'
      ? selectedSessionIds
      : activeTab === 'rapportages'
        ? selectedRapportageIds
        : selectedNoteIds
  const activeSelectedSet = useMemo(() => new Set(activeSelectedIds), [activeSelectedIds])
  const areAllActiveRowsSelected = activeRows.length > 0 && activeRows.every((item) => activeSelectedSet.has(item.id))
  const canStartGeneration = Boolean(selectedTemplate)

  return {
    viewMode, setViewMode, activeTab, setActiveTab, assistantMessage, setAssistantMessage, isGenerating, setIsGenerating,
    generateError, setGenerateError, generatedReportText, setGeneratedReportText, currentReportSessionId, setCurrentReportSessionId,
    selectedTemplateId, setSelectedTemplateId, selectedSessionIds, setSelectedSessionIds, selectedRapportageIds, setSelectedRapportageIds,
    selectedNoteIds, setSelectedNoteIds, fieldValues, setFieldValues, activityAllocationRows, setActivityAllocationRows,
    specialistExpertiseByField, setSpecialistExpertiseByField, specialistTariffByField, setSpecialistTariffByField,
    inputHeights, setInputHeights, assistantMessages, setAssistantMessages, isAssistantSending, setIsAssistantSending,
    selectedCoachee, selectedTrajectory, sessionRows, rapportageRows, noteRows, werkfitTemplates, selectedTemplate, uwvFields, groupedFields,
    specialistTariffAnswerByGroup, activeRows, activeSelectedSet, areAllActiveRowsSelected, canStartGeneration,
  }
}
