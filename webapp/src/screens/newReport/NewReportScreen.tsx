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
import type { Input, Note, Report } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'
import { ProfileCircleIcon } from '@/icons/ProfileCircleIcon'
import { ClientPageDocumentenIcon, ClientPageNotesIcon, ClientPageSessiesIcon } from '@/icons/ClientPageSvgIcons'

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
  return template.name
}

function readItemCountLabel(count: number): string {
  return `${count} geselecteerd`
}

type InputSelectionTab = 'sessies' | 'documenten' | 'notities'

function tabLabel(tab: InputSelectionTab): string {
  if (tab === 'sessies') return 'Sessies'
  if (tab === 'documenten') return 'Documenten'
  return 'Notities'
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
  const [activeTab, setActiveTab] = useState<InputSelectionTab>('sessies')

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

  const sessionInputs = useMemo(
    () => clientInputs.filter((input) => input.type !== 'uploaded-document'),
    [clientInputs],
  )

  const documentInputs = useMemo(
    () => clientInputs.filter((input) => input.type === 'uploaded-document'),
    [clientInputs],
  )

  const noteCountByInputId = useMemo(() => {
    const counts = new Map<string, number>()
    for (const note of clientNotes) {
      const linkedIds = new Set<string>()
      if (note.sourceInputId) linkedIds.add(note.sourceInputId)
      if (note.sessionId) linkedIds.add(note.sessionId)
      for (const linkedId of linkedIds) {
        counts.set(linkedId, (counts.get(linkedId) || 0) + 1)
      }
    }
    return counts
  }, [clientNotes])

  const activeRows = useMemo(() => {
    if (activeTab === 'sessies') return sessionInputs
    if (activeTab === 'documenten') return documentInputs
    return clientNotes
  }, [activeTab, clientNotes, documentInputs, sessionInputs])

  const areAllVisibleRowsSelected = useMemo(() => {
    if (activeRows.length === 0) return false
    if (activeTab === 'notities') return activeRows.every((note) => selectedNoteIds.includes(note.id))
    return activeRows.every((input) => selectedInputIds.includes(input.id))
  }, [activeRows, activeTab, selectedInputIds, selectedNoteIds])

  const selectedSessionCount = useMemo(
    () => sessionInputs.filter((input) => selectedInputIds.includes(input.id)).length,
    [selectedInputIds, sessionInputs],
  )

  const selectedDocumentCount = useMemo(
    () => documentInputs.filter((input) => selectedInputIds.includes(input.id)).length,
    [documentInputs, selectedInputIds],
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

  function toggleVisibleRowsSelection() {
    if (activeRows.length === 0) return
    if (activeTab === 'notities') {
      setSelectedNoteIds((current) => {
        if (areAllVisibleRowsSelected) return current.filter((id) => !activeRows.some((note) => note.id === id))
        const next = new Set(current)
        for (const note of activeRows as Note[]) next.add(note.id)
        return Array.from(next)
      })
      return
    }
    setSelectedInputIds((current) => {
      if (areAllVisibleRowsSelected) return current.filter((id) => !activeRows.some((input) => input.id === id))
      const next = new Set(current)
      for (const input of activeRows as Input[]) next.add(input.id)
      return Array.from(next)
    })
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
        <View style={styles.topBar}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={styles.titlePill}>
                <Text isBold style={styles.title}>Nieuwe rapportage</Text>
              </View>
              <View style={styles.metaPill}>
                <ProfileCircleIcon size={22} />
                <Text isSemibold style={styles.metaText} numberOfLines={1}>
                  {selectedClient?.name || 'Onbekende client'}
                </Text>
              </View>
            </View>
          </View>
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
            {isGenerating ? <ActivityIndicator size="small" color="#BE0165" /> : <Text isBold style={styles.generateButtonText}>Genereer</Text>}
          </Pressable>
        </View>

        {!isClientLocked && activeClients.length > 1 ? (
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
        ) : null}

        <View style={styles.mainLayout}>
          <View style={styles.leftPanel}>
            <View style={styles.panelHeader}>
              <View style={styles.panelHeaderTextWrap}>
                <Text isSemibold style={styles.panelTitle}>Selecteer items</Text>
                <Text style={styles.panelSubtitle}>Kies welke gegevens in het rapport komen</Text>
              </View>
              <Pressable onPress={toggleVisibleRowsSelection}>
                <Text style={styles.toggleAllText}>{areAllVisibleRowsSelected ? 'Deselecteer alles' : 'Alles selecteren'}</Text>
              </Pressable>
            </View>

            <View style={styles.tabsRow}>
              {(['sessies', 'documenten', 'notities'] as const).map((tab) => {
                const isSelected = activeTab === tab
                const iconColor = isSelected ? '#BE0165' : '#2C111F'
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={({ hovered }) => [
                      styles.tabButton,
                      isSelected ? styles.tabButtonActive : styles.tabButtonInactive,
                      hovered && !isSelected ? styles.tabButtonHover : undefined,
                    ]}
                  >
                    <View style={styles.tabIconWrap}>
                      {tab === 'sessies' ? <ClientPageSessiesIcon color={iconColor} size={18} /> : null}
                      {tab === 'documenten' ? <ClientPageDocumentenIcon color={iconColor} size={18} /> : null}
                      {tab === 'notities' ? <ClientPageNotesIcon color={iconColor} size={18} /> : null}
                    </View>
                    <Text style={[styles.tabButtonText, isSelected ? styles.tabButtonTextActive : undefined]}>{tabLabel(tab)}</Text>
                  </Pressable>
                )
              })}
            </View>

            <View style={styles.listWrap}>
              {activeTab === 'notities' ? (
                clientNotes.length === 0 ? (
                  <Text style={styles.emptyStateText}>Geen notities beschikbaar.</Text>
                ) : (
                  clientNotes.map((note) => {
                    const selected = selectedNoteIds.includes(note.id)
                    return (
                      <Pressable
                        key={note.id}
                        onPress={() => toggleNoteSelection(note.id)}
                        style={({ hovered }) => [
                          styles.rowCard,
                          selected ? styles.rowCardSelected : undefined,
                          hovered ? styles.rowCardHover : undefined,
                        ]}
                      >
                        <View style={[styles.checkbox, selected ? styles.checkboxSelected : undefined]} />
                        <View style={styles.rowMain}>
                          <Text isSemibold style={styles.rowTitle}>{note.title || 'Notitie'}</Text>
                          <Text style={styles.rowDate}>{formatDate(note.updatedAtUnixMs)}</Text>
                        </View>
                      </Pressable>
                    )
                  })
                )
              ) : activeRows.length === 0 ? (
                <Text style={styles.emptyStateText}>
                  {activeTab === 'documenten' ? 'Geen documenten beschikbaar voor deze client.' : 'Geen sessies beschikbaar voor deze client.'}
                </Text>
              ) : (
                (activeRows as Input[]).map((input) => {
                  const selected = selectedInputIds.includes(input.id)
                  const approvedSnippets = approvedSnippetCountByInputId.get(input.id) || 0
                  const linkedNoteCount = noteCountByInputId.get(input.id) || 0
                  const isSessionTab = activeTab === 'sessies'
                  return (
                    <Pressable
                      key={input.id}
                      onPress={() => toggleInputSelection(input.id)}
                      style={({ hovered }) => [
                        styles.rowCard,
                        selected ? styles.rowCardSelected : undefined,
                        hovered ? styles.rowCardHover : undefined,
                      ]}
                    >
                      <View style={[styles.checkbox, selected ? styles.checkboxSelected : undefined]} />
                      <View style={styles.rowMain}>
                        <Text isSemibold style={styles.rowTitle}>{input.title}</Text>
                        <Text style={styles.rowDate}>{formatDate(input.createdAtUnixMs)}</Text>
                      </View>
                      <Text style={styles.rowRightMeta}>
                        {isSessionTab ? `${linkedNoteCount} ${linkedNoteCount === 1 ? 'notitie' : 'notities'}` : `${approvedSnippets} snippets`}
                      </Text>
                    </Pressable>
                  )
                })
              )}
            </View>
          </View>

          <View style={styles.rightPanel}>
            <View style={styles.summaryCard}>
              <Text isSemibold style={styles.summaryName}>{selectedClient?.name || 'Onbekende client'}</Text>
              <View style={styles.summaryGrid}>
                <Text style={styles.summaryLabel}>Template</Text>
                <Text style={styles.summaryValue}>{selectedTemplate?.name || '-'}</Text>

                <Text style={styles.summaryLabel}>Sessies</Text>
                <Text style={styles.summaryValue}>{readItemCountLabel(selectedSessionCount)}</Text>

                <Text style={styles.summaryLabel}>Documenten</Text>
                <Text style={styles.summaryValue}>{readItemCountLabel(selectedDocumentCount)}</Text>

                <Text style={styles.summaryLabel}>Notities</Text>
                <Text style={styles.summaryValue}>{readItemCountLabel(selectedNoteIds.length)}</Text>
              </View>
            </View>

            <View style={styles.templateCardPanel}>
              <Text isSemibold style={styles.templatePanelTitle}>Selecteer een template</Text>
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
                          styles.templateOption,
                          selected ? styles.templateOptionSelected : undefined,
                          hovered ? styles.templateOptionHover : undefined,
                        ]}
                      >
                        <View style={[styles.radio, selected ? styles.radioSelected : undefined]} />
                        <View style={styles.templateOptionContent}>
                          <Text isSemibold style={styles.templateTitle}>{readTemplateLabel(template)}</Text>
                          <Text style={styles.templateDescription}>{template.description}</Text>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              )}
            </View>

            <Text style={styles.footerHint}>Geselecteerde goedgekeurde snippets: {selectedApprovedSnippetCount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F6F4F7' },
  scroll: { flex: 1 },
  content: { padding: 24, gap: 12, paddingBottom: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  header: { flex: 1, minWidth: 260, justifyContent: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, flexWrap: 'wrap' },
  titlePill: { height: 48, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 8 },
  title: { fontSize: 20, lineHeight: 24, color: '#2C111F' },
  metaPill: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  mainLayout: { flexDirection: 'row', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  leftPanel: { flex: 1, minWidth: 680, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', padding: 0, gap: 0 },
  rightPanel: { width: 437, minWidth: 330, gap: 14, flex: 1 },
  panelHeaderTextWrap: { gap: 0 },
  panelTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  panelSubtitle: { fontSize: 14, lineHeight: 20, color: '#93858D' },
  toggleAllText: { fontSize: 16, lineHeight: 24, color: '#BE0165' },
  tabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 1, borderTopColor: '#DFE0E2', paddingTop: 12, paddingHorizontal: 24, paddingBottom: 10 },
  tabButton: {
    height: 48,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  tabButtonActive: { backgroundColor: '#FFFFFF', borderColor: '#DFE0E2', borderBottomWidth: 0 },
  tabButtonInactive: { backgroundColor: '#F9FAFB', borderColor: '#DFE0E2', borderBottomWidth: 1 },
  tabButtonHover: { backgroundColor: '#FAFBFD' },
  tabIconWrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  tabButtonText: { fontSize: 16, lineHeight: 20, color: '#2C111F' },
  tabButtonTextActive: { color: '#BE0165' },
  listWrap: { gap: 10, paddingHorizontal: 24, paddingBottom: 16 },
  rowCard: {
    minHeight: 76,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowCardSelected: { borderColor: '#DFE0E2', backgroundColor: '#FFFFFF' },
  rowCardHover: { backgroundColor: '#FAF8FB' },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#767676', backgroundColor: '#FFFFFF' },
  checkboxSelected: { borderColor: '#BE0165', backgroundColor: '#BE0165' },
  rowMain: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  rowDate: { fontSize: 14, lineHeight: 20, color: '#93858D' },
  rowRightMeta: { fontSize: 14, lineHeight: 20, color: '#7B6C75' },
  summaryCard: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 20, gap: 10 },
  summaryName: { fontSize: 24, lineHeight: 30, color: '#2C111F' },
  summaryGrid: { marginTop: 2, gap: 6 },
  summaryLabel: { fontSize: 14, lineHeight: 18, color: '#93858D' },
  summaryValue: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  templateCardPanel: { borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', padding: 20, gap: 12 },
  templatePanelTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  loadingWrap: { minHeight: 72, alignItems: 'center', justifyContent: 'center' },
  templateList: { gap: 10 },
  templateOption: {
    minHeight: 76,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateOptionSelected: { borderColor: '#BE0165', backgroundColor: '#FCF2F7' },
  templateOptionHover: { backgroundColor: '#FAFBFD' },
  radio: { width: 16, height: 16, borderRadius: 999, borderWidth: 1, borderColor: '#767676', marginTop: 2, backgroundColor: '#FFFFFF' },
  radioSelected: { borderColor: '#BE0165', borderWidth: 2, backgroundColor: '#BE0165' },
  templateOptionContent: { flex: 1, minWidth: 0, gap: 3 },
  templateTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  templateDescription: { fontSize: 14, lineHeight: 20, color: '#93858D' },
  emptyStateText: { padding: 14, fontSize: 14, lineHeight: 20, color: '#7A6C75' },
  clientRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  clientChip: { borderRadius: 999, borderWidth: 1, borderColor: '#DADCE0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8 },
  clientChipSelected: { borderColor: '#BE0165', backgroundColor: '#FDF1F7' },
  clientChipHover: { backgroundColor: '#F9FAFB' },
  clientChipText: { fontSize: 13, lineHeight: 16, color: '#2C111F' },
  clientChipTextSelected: { color: '#8D005A' },
  footerHint: { fontSize: 13, lineHeight: 18, color: '#4C4048', paddingHorizontal: 2 },
  generateButton: {
    height: 40,
    width: 132,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BE0165',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  generateButtonHover: { backgroundColor: '#FCF2F7' },
  generateButtonDisabled: { borderColor: '#D2D2D2', backgroundColor: '#F3F4F6' },
  generateButtonText: { fontSize: 14, lineHeight: 18, color: '#BE0165' },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 14,
  },
})
