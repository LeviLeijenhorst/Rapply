import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { listPipelineTemplates, readPipelineReport, readPipelineReportByInput, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { exportReportToWord } from '@/api/reports/exportReportToWord'
import { ReportUwvLogoIcon } from '@/icons/ReportScreenIcons'
import { ReportEditorPanel } from '@/screens/report/ReportEditorPanel'
import { buildStructuredExportContext, buildStructuredReportText } from '@/screens/report/structuredReportExport'
import type { ReportScreenProps } from '@/screens/report/report.types'
import { Header } from '@/screens/session/components/Header'
import type { Report } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

function isNotAuthenticatedError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Not authenticated'
}

async function loadReportFromReference(referenceId: string): Promise<Report | null> {
  const trimmedReference = String(referenceId || '').trim()
  if (!trimmedReference) return null
  try {
    const report = await readPipelineReport(trimmedReference)
    if (report) return report
  } catch (error) {
    if (isNotAuthenticatedError(error)) throw error
    // Continue with input lookup for non-auth failures.
  }
  try {
    const reportByInput = await readPipelineReportByInput(trimmedReference)
    if (reportByInput) return reportByInput
  } catch (error) {
    if (isNotAuthenticatedError(error)) throw error
    // Continue with null fallback for non-auth failures.
  }
  return null
}

async function loadReportRobust(referenceId: string, fallbackReportId: string | null): Promise<Report | null> {
  const candidates = [fallbackReportId, referenceId].filter((id): id is string => Boolean(String(id || '').trim()))
  for (const candidate of candidates) {
    const report = await loadReportFromReference(candidate)
    if (report) return report
  }
  return null
}

export function ReportScreen(props: ReportScreenProps) {
  const referenceId = props.initialInputId ?? props.initialSessionId ?? null
  const { showErrorToast, showToast } = useToast()
  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [hideNotFoundMessage, setHideNotFoundMessage] = useState(false)

  const emptyMessage = useMemo(() => {
    if (authRequired) return 'Je bent niet ingelogd. Log opnieuw in om het rapport te openen.'
    if (!referenceId) return 'Geen rapportreferentie ontvangen.'
    if (hideNotFoundMessage) return ''
    return 'Rapport niet gevonden voor deze selectie.'
  }, [authRequired, hideNotFoundMessage, referenceId])

  useEffect(() => {
    let isCancelled = false
    setHideNotFoundMessage(false)
    setIsLoading(true)
    void (async () => {
      try {
        setAuthRequired(false)
        const loadedTemplates = await listPipelineTemplates().catch((error) => {
          showErrorToast(error instanceof Error ? error.message : 'Templates laden mislukt.')
          return [] as PipelineTemplate[]
        })
        const loadedReport = referenceId ? await loadReportRobust(referenceId, report?.id ?? null) : null
        if (isCancelled) return
        setTemplates(loadedTemplates)
        setReport(loadedReport)
      } catch (error) {
        if (isCancelled) return
        if (isNotAuthenticatedError(error)) {
          setAuthRequired(true)
          setReport(null)
          setTemplates([])
          return
        }
        showErrorToast(error instanceof Error ? error.message : 'Rapport laden mislukt.')
      } finally {
        if (isCancelled) return
        setIsLoading(false)
      }
    })()
    return () => {
      isCancelled = true
    }
  }, [referenceId, showErrorToast])

  async function handleReload() {
    if (!referenceId) return
    setHideNotFoundMessage(true)
    setIsLoading(true)
    try {
      setAuthRequired(false)
      const loadedReport = await loadReportRobust(referenceId, report?.id ?? null)
      setReport(loadedReport)
      if (loadedReport) setHideNotFoundMessage(false)
    } catch (error) {
      if (isNotAuthenticatedError(error)) {
        setAuthRequired(true)
        setReport(null)
        return
      }
      showErrorToast(error instanceof Error ? error.message : 'Rapport opnieuw laden mislukt.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleExportWord() {
    if (!report?.reportStructuredJson) return
    const template = templates.find((item) => item.id === report.reportStructuredJson?.templateId)
    if (!template) {
      showErrorToast('Geen ondersteund UWV-template gevonden voor export.')
      return
    }
    setIsExporting(true)
    try {
      const didExport = await exportReportToWord({
        templateName: template.name,
        reportText: buildStructuredReportText(template, report.reportStructuredJson),
        contextValues: buildStructuredExportContext(template, report.reportStructuredJson),
      })
      if (!didExport) showErrorToast('Geen ondersteund UWV-template gevonden voor export.')
      else showToast('Word-export gestart.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Word-export mislukt.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="small" color="#BE0165" />
      </View>
    )
  }

  if (!report) {
    return (
      <View style={styles.emptyWrap}>
        {emptyMessage ? <Text style={styles.emptyText}>{emptyMessage}</Text> : null}
        {referenceId ? (
          <Pressable onPress={() => void handleReload()} style={({ hovered }) => [styles.reloadButton, hovered ? styles.reloadButtonHover : undefined]}>
            <Text isSemibold style={styles.reloadButtonText}>Opnieuw laden</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.screenWrap}>
      <View style={styles.headerRow}>
        <View style={styles.headerWrap}>
          <Header
            title={report.title || props.headerTitle || 'Rapportage'}
            clientName={props.headerClientName || 'Cliënt'}
            date=""
            onBack={props.onBack || (() => {})}
          />
        </View>
        <Pressable onPress={() => void handleExportWord()} style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHover : undefined]}>
          {isExporting ? <ActivityIndicator size="small" color="#007ACF" /> : <View style={styles.exportButtonContent}><ReportUwvLogoIcon /><Text isSemibold style={styles.exportButtonText}>Exporteer naar Word</Text></View>}
        </Pressable>
      </View>
      <ReportEditorPanel report={report} templates={templates} onReportUpdated={setReport} showExportButton={false} />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5F8' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, backgroundColor: '#F7F5F8' },
  emptyText: { fontSize: 16, lineHeight: 22, color: '#2C111F', textAlign: 'center' },
  reloadButton: {
    minHeight: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BE0165',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  reloadButtonHover: { backgroundColor: '#FFF2F9' },
  reloadButtonText: { fontSize: 13, lineHeight: 16, color: '#BE0165' },
  screenWrap: { flex: 1, backgroundColor: '#F7F5F8', paddingHorizontal: 24, paddingTop: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerWrap: { flex: 1, minWidth: 0 },
  exportButton: {
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007ACF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportButtonHover: { backgroundColor: '#EFF7FF' },
  exportButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportButtonText: { color: '#007ACF' },
})
