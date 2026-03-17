import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { listPipelineTemplates, readPipelineReport, readPipelineReportByInput, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { ReportEditorPanel } from '@/screens/report/ReportEditorPanel'
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
  const { showErrorToast } = useToast()
  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authRequired, setAuthRequired] = useState(false)

  const emptyMessage = useMemo(() => {
    if (authRequired) return 'Je bent niet ingelogd. Log opnieuw in om het rapport te openen.'
    if (!referenceId) return 'Geen rapportreferentie ontvangen.'
    return 'Rapport niet gevonden voor deze selectie.'
  }, [authRequired, referenceId])

  useEffect(() => {
    let isCancelled = false
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
    setIsLoading(true)
    try {
      setAuthRequired(false)
      const loadedReport = await loadReportRobust(referenceId, report?.id ?? null)
      setReport(loadedReport)
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
        <Text style={styles.emptyText}>{emptyMessage}</Text>
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
      <Header
        title={report.title || props.headerTitle || 'Rapportage'}
        clientName={props.headerClientName || 'Cliënt'}
        date=""
        onBack={props.onBack || (() => {})}
      />
      <ReportEditorPanel report={report} templates={templates} onReportUpdated={setReport} />
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
})

