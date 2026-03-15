import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { listPipelineTemplates, readPipelineReport, readPipelineReportByInput, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { ReportEditorPanel } from '@/screens/report/ReportEditorPanel'
import type { ReportScreenProps } from '@/screens/report/report.types'
import type { Report } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

async function loadReportFromReference(referenceId: string): Promise<Report | null> {
  const trimmedReference = String(referenceId || '').trim()
  if (!trimmedReference) return null
  try {
    const report = await readPipelineReport(trimmedReference)
    if (report) return report
  } catch {
    // Continue with input lookup.
  }
  try {
    const reportByInput = await readPipelineReportByInput(trimmedReference)
    if (reportByInput) return reportByInput
  } catch {
    // Continue with null fallback.
  }
  return null
}

export function ReportScreen(props: ReportScreenProps) {
  const referenceId = props.initialInputId ?? props.initialSessionId ?? null
  const { showErrorToast } = useToast()
  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const emptyMessage = useMemo(() => {
    if (!referenceId) return 'Geen rapportreferentie ontvangen.'
    return 'Rapport niet gevonden voor deze selectie.'
  }, [referenceId])

  useEffect(() => {
    let isCancelled = false
    setIsLoading(true)
    void (async () => {
      try {
        const [loadedTemplates, loadedReport] = await Promise.all([
          listPipelineTemplates(),
          referenceId ? loadReportFromReference(referenceId) : Promise.resolve(null),
        ])
        if (isCancelled) return
        setTemplates(loadedTemplates)
        setReport(loadedReport)
      } catch (error) {
        if (isCancelled) return
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
      const loadedReport = await loadReportFromReference(referenceId)
      setReport(loadedReport)
    } catch (error) {
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
  screenWrap: { flex: 1, backgroundColor: '#FFFFFF' },
})
