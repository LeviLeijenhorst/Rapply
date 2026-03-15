import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { generateReport, listPipelineTemplates, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import {
  buildApprovedSnippetCountByInputId,
  canGeneratePipelineReport,
  countSelectedApprovedSnippets,
  toggleSelectionId,
} from '@/screens/newReport/newReportPipelineLogic'
import { ReportEditorPanel } from '@/screens/report/ReportEditorPanel'
import type { NewReportScreenProps } from '@/screens/newReport/newReport.types'
import { useLocalAppData } from '@/storage/LocalAppDataProvider'
import type { Report } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false
  }
  return true
}

function formatDate(unixMs: number): string {
  return new Date(unixMs).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function readTemplateLabel(template: PipelineTemplate): string {
  const fieldCount = template.fields.length
  return `${template.name} (${fieldCount} velden)`
}

export function NewReportScreen(props: NewReportScreenProps) {
  const initialClientId = props.initialClientId ?? props.initialCoacheeId ?? null
  const isClientLocked = Boolean(initialClientId)
  const { data, refreshAppData } = useLocalAppData()
  const { showErrorToast, showToast } = useToast()

  const [templates, setTemplates] = useState<PipelineTemplate[]>([])
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedInputIds, setSelectedInputIds] = useState<string[]>([])
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([])
  const [activeReport, setActiveReport] = useState<Report | null>(null)

  const activeClients = useMemo(() => data.clients.filter((client) => !client.isArchived), [data.clients])
  const selectedClient = useMemo(
    () => activeClients.find((client) => client.id === selectedClientId) ?? null,
    [activeClients, selectedClientId],
  )

  useEffect(() => {
    if (isClientLocked) {
      if (selectedClientId !== initialClientId) setSelectedClientId(initialClientId)
      return
    }
    if (selectedClientId && activeClients.some((client) => client.id === selectedClientId)) return
    setSelectedClientId(activeClients[0]?.id ?? null)
  }, [activeClients, initialClientId, isClientLocked, selectedClientId])

  useEffect(() => {
    let isCancelled = false
    setIsTemplatesLoading(true)
    void listPipelineTemplates()
      .then((result) => {
        if (isCancelled) return
        setTemplates(result)
        setSelectedTemplateId((current) => {
          if (current && result.some((template) => template.id === current)) return current
          return result[0]?.id ?? null
        })
      })
      .catch((error) => {
        if (isCancelled) return
        showErrorToast(error instanceof Error ? error.message : 'Templates laden mislukt.')
      })
      .finally(() => {
        if (isCancelled) return
        setIsTemplatesLoading(false)
      })
    return () => {
      isCancelled = true
    }
  }, [showErrorToast])

  const clientInputs = useMemo(
    () =>
      data.inputs
        .filter((input) => input.clientId === selectedClientId)
        .sort((leftInput, rightInput) => rightInput.createdAtUnixMs - leftInput.createdAtUnixMs),
    [data.inputs, selectedClientId],
  )

  const clientNotes = useMemo(
    () =>
      data.notes
        .filter((note) => note.clientId === selectedClientId)
        .sort((leftNote, rightNote) => rightNote.updatedAtUnixMs - leftNote.updatedAtUnixMs),
    [data.notes, selectedClientId],
  )

  useEffect(() => {
    const availableInputIds = new Set(clientInputs.map((input) => input.id))
    setSelectedInputIds((current) => {
      const next = current.filter((inputId) => availableInputIds.has(inputId))
      const fallback = clientInputs.map((input) => input.id)
      const resolved = next.length > 0 ? next : fallback
      return areStringArraysEqual(current, resolved) ? current : resolved
    })
    const availableNoteIds = new Set(clientNotes.map((note) => note.id))
    setSelectedNoteIds((current) => {
      const next = current.filter((noteId) => availableNoteIds.has(noteId))
      return areStringArraysEqual(current, next) ? current : next
    })
  }, [clientInputs, clientNotes])

  const approvedSnippetCountByInputId = useMemo(() => buildApprovedSnippetCountByInputId(data.snippets), [data.snippets])

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates],
  )

  const selectedApprovedSnippetCount = useMemo(
    () => countSelectedApprovedSnippets(selectedInputIds, approvedSnippetCountByInputId),
    [approvedSnippetCountByInputId, selectedInputIds],
  )

  const canGenerateReport = canGeneratePipelineReport({
    selectedClientId,
    selectedTemplateId,
    selectedInputIds,
    isGenerating,
  })

  function toggleInputSelection(inputId: string) {
    setSelectedInputIds((current) => toggleSelectionId(current, inputId))
  }

  function toggleNoteSelection(noteId: string) {
    setSelectedNoteIds((current) => toggleSelectionId(current, noteId))
  }

  async function handleGenerateReport() {
    if (!selectedClientId || !selectedTemplateId) return
    if (selectedInputIds.length === 0) {
      showErrorToast('Selecteer minimaal een input.')
      return
    }
    if (selectedApprovedSnippetCount === 0) {
      showErrorToast('Geen goedgekeurde snippets in de selectie. Keur eerst snippets goed.')
      return
    }
    setIsGenerating(true)
    try {
      const report = await generateReport({
        templateId: selectedTemplateId,
        clientId: selectedClientId,
        selectedInputIds,
        selectedNoteIds,
        title: selectedTemplate?.name || 'UWV rapport',
      })
      setActiveReport(report)
      await refreshAppData()
      showToast('Rapport gegenereerd.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Rapport genereren mislukt.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (activeReport) {
    return (
      <View style={styles.page}>
        <ReportEditorPanel report={activeReport} templates={templates} onReportUpdated={setActiveReport} />
      </View>
    )
  }

  return (
    <View style={styles.page}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text isBold style={styles.title}>Nieuwe rapportage</Text>
          <Text style={styles.subtitle}>Selecteer template, inputs en notities. Genereren gebruikt alleen goedgekeurde snippets.</Text>
        </View>

        <View style={styles.section}>
          <Text isSemibold style={styles.sectionTitle}>Client</Text>
          {isClientLocked ? (
            <View style={styles.clientLockCard}>
              <Text isSemibold style={styles.clientLockTitle}>{selectedClient?.name || 'Onbekende client'}</Text>
              <Text style={styles.clientLockSubtitle}>Deze rapportage is gekoppeld aan de geopende client.</Text>
            </View>
          ) : (
            <View style={styles.clientRow}>
              {activeClients.map((client) => {
                const selected = client.id === selectedClientId
                return (
                  <Pressable
                    key={client.id}
                    onPress={() => setSelectedClientId(client.id)}
                    style={({ hovered }) => [
                      styles.clientChip,
                      selected ? styles.clientChipSelected : undefined,
                      hovered ? styles.clientChipHover : undefined,
                    ]}
                  >
                    <Text style={[styles.clientChipText, selected ? styles.clientChipTextSelected : undefined]}>{client.name}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text isSemibold style={styles.sectionTitle}>Template</Text>
          {isTemplatesLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#BE0165" />
            </View>
          ) : (
            <View style={styles.templateList}>
              {templates.map((template) => {
                const selected = template.id === selectedTemplateId
                return (
                  <Pressable
                    key={template.id}
                    onPress={() => setSelectedTemplateId(template.id)}
                    style={({ hovered }) => [
                      styles.templateCard,
                      selected ? styles.templateCardSelected : undefined,
                      hovered ? styles.templateCardHover : undefined,
                    ]}
                  >
                    <Text isSemibold style={styles.templateTitle}>{readTemplateLabel(template)}</Text>
                    <Text style={styles.templateDescription}>{template.description}</Text>
                  </Pressable>
                )
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text isSemibold style={styles.sectionTitle}>Inputs</Text>
          <View style={styles.listCard}>
            {clientInputs.length === 0 ? (
              <Text style={styles.emptyStateText}>Geen inputs beschikbaar voor deze client.</Text>
            ) : (
              clientInputs.map((input) => {
                const selected = selectedInputIds.includes(input.id)
                const approvedSnippets = approvedSnippetCountByInputId.get(input.id) || 0
                return (
                  <Pressable
                    key={input.id}
                    onPress={() => toggleInputSelection(input.id)}
                    style={({ hovered }) => [styles.listRow, hovered ? styles.listRowHover : undefined]}
                  >
                    <View style={[styles.checkbox, selected ? styles.checkboxSelected : undefined]} />
                    <View style={styles.listRowMeta}>
                      <Text isSemibold style={styles.listRowTitle}>{input.title}</Text>
                      <Text style={styles.listRowSubtitle}>
                        {formatDate(input.createdAtUnixMs)} - {approvedSnippets} goedgekeurde snippets
                      </Text>
                    </View>
                  </Pressable>
                )
              })
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text isSemibold style={styles.sectionTitle}>Notities (optioneel)</Text>
          <View style={styles.listCard}>
            {clientNotes.length === 0 ? (
              <Text style={styles.emptyStateText}>Geen notities beschikbaar.</Text>
            ) : (
              clientNotes.map((note) => {
                const selected = selectedNoteIds.includes(note.id)
                return (
                  <Pressable
                    key={note.id}
                    onPress={() => toggleNoteSelection(note.id)}
                    style={({ hovered }) => [styles.listRow, hovered ? styles.listRowHover : undefined]}
                  >
                    <View style={[styles.checkbox, selected ? styles.checkboxSelected : undefined]} />
                    <View style={styles.listRowMeta}>
                      <Text isSemibold style={styles.listRowTitle}>{note.title || 'Notitie'}</Text>
                      <Text style={styles.listRowSubtitle}>{formatDate(note.updatedAtUnixMs)}</Text>
                    </View>
                  </Pressable>
                )
              })
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>Geselecteerde goedgekeurde snippets: {selectedApprovedSnippetCount}</Text>
          <Pressable
            onPress={() => {
              void handleGenerateReport()
            }}
            disabled={!canGenerateReport}
            style={({ hovered }) => [
              styles.generateButton,
              hovered && canGenerateReport ? styles.generateButtonHover : undefined,
              !canGenerateReport ? styles.generateButtonDisabled : undefined,
            ]}
          >
            {isGenerating ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text isBold style={styles.generateButtonText}>Genereer rapport</Text>}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F5F8' },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 18, paddingBottom: 28 },
  header: { gap: 6 },
  title: { fontSize: 36, lineHeight: 42, color: '#2C111F' },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#6F5F67' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 18, lineHeight: 22, color: '#2C111F' },
  clientRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  clientChip: { borderRadius: 999, borderWidth: 1, borderColor: '#DADCE0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8 },
  clientChipSelected: { borderColor: '#BE0165', backgroundColor: '#FDF1F7' },
  clientChipHover: { backgroundColor: '#F9FAFB' },
  clientChipText: { fontSize: 13, lineHeight: 16, color: '#2C111F' },
  clientChipTextSelected: { color: '#8D005A' },
  clientLockCard: { borderRadius: 10, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 12, gap: 3 },
  clientLockTitle: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  clientLockSubtitle: { fontSize: 12, lineHeight: 16, color: '#7A6C75' },
  loadingWrap: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  templateList: { gap: 10 },
  templateCard: { borderRadius: 10, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 12, gap: 4 },
  templateCardSelected: { borderColor: '#BE0165', backgroundColor: '#FCF2F7' },
  templateCardHover: { backgroundColor: '#FAFBFD' },
  templateTitle: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  templateDescription: { fontSize: 13, lineHeight: 18, color: '#6F5F67' },
  listCard: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  listRow: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: '#F1F1F1' },
  listRowHover: { backgroundColor: '#FAFBFD' },
  checkbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, borderColor: '#767676', backgroundColor: '#FFFFFF' },
  checkboxSelected: { borderColor: '#BE0165', backgroundColor: '#BE0165' },
  listRowMeta: { flex: 1, minWidth: 0, gap: 2 },
  listRowTitle: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  listRowSubtitle: { fontSize: 12, lineHeight: 16, color: '#7A6C75' },
  emptyStateText: { padding: 14, fontSize: 13, lineHeight: 18, color: '#7A6C75' },
  footer: { marginTop: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  footerHint: { fontSize: 13, lineHeight: 18, color: '#4C4048' },
  generateButton: { minHeight: 44, minWidth: 190, borderRadius: 8, backgroundColor: '#BE0165', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  generateButtonHover: { backgroundColor: '#9E004F' },
  generateButtonDisabled: { backgroundColor: '#B9B0B5' },
  generateButtonText: { fontSize: 14, lineHeight: 18, color: '#FFFFFF' },
})


