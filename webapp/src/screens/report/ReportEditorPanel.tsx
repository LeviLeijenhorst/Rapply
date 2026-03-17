import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { ChevronDownIcon } from '@/icons/ChevronDownIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { ReportUwvLogoIcon } from '@/icons/ReportScreenIcons'
import { readPipelineReport, saveReportFieldEdit, streamReportPipelineChatMessage, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { exportReportToWord } from '@/api/reports/exportReportToWord'
import {
  asObject,
  capitalizeFirstLetter,
  composeNameField,
  decomposeNameField,
  formatInitialsForEditing,
  isDefaultCollapsedSection,
  normalizeNumericInput,
  readDefaultSectionTitle,
  readFieldVariant,
  readNumberFromLabel,
  readSingleChoiceOptions,
  REINTEGRATIE_ACTIVITEITEN_OPTIES,
  stripNumberPrefix,
} from '@/screens/report/reportEditorFieldUi'
import { hasChatFieldUpdates, readFieldOrder } from '@/screens/report/reportEditorLogic'
import { buildStructuredExportContext, buildStructuredReportText } from '@/screens/report/structuredReportExport'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ChatMessage } from '@/screens/shared/components/chat/ChatMessage'
import type { JsonValue, Report, ReportFieldType } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

type Props = { report: Report; templates: PipelineTemplate[]; onReportUpdated: (report: Report) => void; showExportButton?: boolean }
type ChatRow = { id: string; role: 'user' | 'assistant'; text: string }
type RenderField = { key: string; sourceFieldId: string; numberKey: string; label: string; fieldType: ReportFieldType; variant: ReturnType<typeof readFieldVariant> }
type RenderSection = { key: string; title: string; fields: RenderField[]; status: 'complete' | 'incomplete' }

const webNoOutlineInputStyle = { outlineStyle: 'none', outlineWidth: 0, resize: 'none', overflow: 'hidden' } as any
const ONE_LINE_HEIGHT = 40
const FIVE_LINE_HEIGHT = 110
const HOUR_INPUT_SIZE = 72
const ROW_ACTION_SIZE = 36

function answerToText(answer: JsonValue): string {
  if (typeof answer === 'string') return answer
  if (answer === null || typeof answer === 'undefined') return ''
  return JSON.stringify(answer)
}

function readJsonChoice(answer: JsonValue, key: string): number | null {
  const obj = asObject(answer)
  return typeof obj?.[key] === 'number' ? (obj?.[key] as number) : null
}

function isAnswerFilled(answer: JsonValue): boolean {
  if (typeof answer === 'string') return answer.trim().length > 0
  if (typeof answer === 'number' || typeof answer === 'boolean') return true
  if (!answer) return false
  if (Array.isArray(answer)) return answer.length > 0
  return Object.keys(answer).length > 0
}

function parsePostcodePlace(value: string): { postcode: string; place: string } {
  const text = String(value || '').trim()
  const match = text.match(/(\d{4}\s?[A-Za-z]{2})\s*(.*)$/)
  if (!match) return { postcode: '', place: text }
  return { postcode: String(match[1] || '').toUpperCase().replace(/\s+/g, ''), place: String(match[2] || '').trim() }
}

function joinPostcodePlace(postcode: string, place: string): string {
  const p = String(postcode || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  return `${p} ${String(place || '').trim()}`.trim()
}

export function ReportEditorPanel({ report, templates, onReportUpdated, showExportButton = true }: Props) {
  const { showErrorToast, showToast } = useToast()
  const [draftByFieldId, setDraftByFieldId] = useState<Record<string, JsonValue>>({})
  const [collapsedBySectionKey, setCollapsedBySectionKey] = useState<Record<string, boolean>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatRows, setChatRows] = useState<ChatRow[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [repeatableRowsByFieldId, setRepeatableRowsByFieldId] = useState<Record<string, Array<{ id: string; hours: string; activity: string }>>>({})
  const [inputHeightByFieldKey, setInputHeightByFieldKey] = useState<Record<string, number>>({})
  const setInputHeight = (key: string, nextHeight: number, minHeight = FIVE_LINE_HEIGHT) => {
    const normalizedHeight = Math.max(minHeight, Math.ceil(nextHeight))
    setInputHeightByFieldKey((prev) => {
      const currentHeight = prev[key] ?? minHeight
      const delta = normalizedHeight - currentHeight
      if (Math.abs(delta) < 6) return prev
      if (delta < 0 && Math.abs(delta) < 18) return prev
      return { ...prev, [key]: normalizedHeight }
    })
  }
  const makeActivityRow = (activity = '', hours = '') => ({ id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, activity, hours })

  const structured = report.reportStructuredJson
  const template = useMemo(() => templates.find((item) => item.id === structured?.templateId) ?? null, [structured?.templateId, templates])
  const orderedFieldIds = useMemo(() => readFieldOrder(report, template), [report, template])
  const getCurrentAnswer = (fieldId: string): JsonValue => draftByFieldId[fieldId] ?? structured?.fields[fieldId]?.answer ?? ''

  const rp81Choice = readJsonChoice(getCurrentAnswer('rp_werkfit_8_1'), 'keuze')
  const er42Choice = readJsonChoice(getCurrentAnswer('er_werkfit_4_2'), 'keuze')
  const hiddenFieldIds = useMemo(() => {
    const hidden = new Set<string>()
    if (rp81Choice === 2) { hidden.add('rp_werkfit_8_2'); hidden.add('rp_werkfit_8_3') }
    if (er42Choice === 1) { hidden.add('er_werkfit_6_1'); hidden.add('er_werkfit_6_2') }
    if (er42Choice === 2) { hidden.add('er_werkfit_5_1'); hidden.add('er_werkfit_5_2') }
    if (er42Choice === 3) { hidden.add('er_werkfit_5_1'); hidden.add('er_werkfit_5_2'); hidden.add('er_werkfit_6_1'); hidden.add('er_werkfit_6_2') }
    return hidden
  }, [rp81Choice, er42Choice])

  const sections = useMemo<RenderSection[]>(() => {
    if (!structured) return []
    const grouped = new Map<string, RenderField[]>()
    for (const fieldId of orderedFieldIds) {
      if (hiddenFieldIds.has(fieldId)) continue
      const source = structured.fields[fieldId]
      if (!source) continue
      const numberKey = template?.fields.find((f) => f.fieldId === fieldId)?.exportNumberKey || readNumberFromLabel(source.label)
      const sectionKey = (numberKey.split('.')[0] || '0').trim()
      if (sectionKey === '9') continue
      const label = stripNumberPrefix(source.label) || source.label
      const variant = readFieldVariant({ fieldId, numberKey, fieldType: source.fieldType })
      const entries: RenderField[] = [{ key: fieldId, sourceFieldId: fieldId, numberKey, label, fieldType: source.fieldType, variant }]
      if (!grouped.has(sectionKey)) grouped.set(sectionKey, [])
      grouped.get(sectionKey)?.push(...entries)
    }
    return Array.from(grouped.entries()).map(([key, fields]) => {
      const answered = fields.filter((field) => isAnswerFilled(structured.fields[field.sourceFieldId]?.answer ?? '')).length
      return { key, title: readDefaultSectionTitle(key, fields[0]?.label || ''), fields, status: answered === fields.length && fields.length > 0 ? 'complete' : 'incomplete' }
    })
  }, [structured, orderedFieldIds, template, hiddenFieldIds])

  React.useEffect(() => {
    if (!sections.length) return
    setCollapsedBySectionKey((prev) => {
      const next = { ...prev }
      for (const section of sections) if (!(section.key in next)) next[section.key] = isDefaultCollapsedSection(section.title)
      return next
    })
  }, [sections])

  React.useEffect(() => {
    if (!structured) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (const [fieldId, nextValue] of Object.entries(draftByFieldId)) {
      const current = structured.fields[fieldId]?.answer
      if (JSON.stringify(current ?? '') === JSON.stringify(nextValue ?? '')) continue
      timers.push(setTimeout(() => { void handleSaveField(fieldId, nextValue) }, 700))
    }
    return () => timers.forEach(clearTimeout)
  }, [draftByFieldId, structured])

  async function handleSaveField(fieldId: string, answer: JsonValue) {
    try {
      const response = await saveReportFieldEdit({ reportId: report.id, fieldId, answer })
      onReportUpdated(response.report)
      setDraftByFieldId((prev) => {
        const next = { ...prev }; delete next[fieldId]; return next
      })
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Veld opslaan mislukt.')
    }
  }

  async function handleSendChat() {
    const trimmed = chatMessage.trim()
    if (!trimmed || isChatSending) return
    const nextRows = [...chatRows, { id: `user-${Date.now()}`, role: 'user' as const, text: trimmed }]
    const assistantId = `assistant-stream-${Date.now()}`
    setChatRows([...nextRows, { id: assistantId, role: 'assistant', text: '' }]); setChatMessage(''); setIsChatSending(true)
    try {
      const response = await streamReportPipelineChatMessage({
        reportId: report.id,
        messages: nextRows.map((row) => ({ role: row.role, text: row.text })),
        onDelta: (delta) => {
          setChatRows((prev) => prev.map((row) => (row.id === assistantId ? { ...row, text: `${row.text}${delta}` } : row)))
        },
      })
      setChatRows((prev) => prev.map((row) => (row.id === assistantId ? { ...row, text: response.answer || 'Geen antwoord ontvangen.' } : row)))
      if (hasChatFieldUpdates(response)) {
        const refreshed = await readPipelineReport(report.id)
        if (refreshed) onReportUpdated(refreshed)
      }
    } catch (error) {
      setChatRows((prev) =>
        prev.map((row) => (row.id === assistantId ? { ...row, text: error instanceof Error ? error.message : 'Chat mislukt.' } : row)),
      )
    } finally { setIsChatSending(false) }
  }

  async function handleExportWord() {
    if (!structured || !template) return
    setIsExporting(true)
    try {
      const didExport = await exportReportToWord({ templateName: template.name, reportText: buildStructuredReportText(template, structured), contextValues: buildStructuredExportContext(template, structured) })
      if (!didExport) showErrorToast('Geen ondersteund UWV-template gevonden voor export.')
      else showToast('Word-export gestart.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Word-export mislukt.')
    } finally { setIsExporting(false) }
  }

  if (!structured) return <View style={styles.emptyWrap}><Text style={styles.emptyText}>Structured report data ontbreekt voor dit rapport.</Text></View>

  const latestAssistantStreamMessage = [...chatRows].reverse().find((row) => row.id.startsWith('assistant-stream-')) ?? null
  const shouldShowChatLoading = isChatSending && (!latestAssistantStreamMessage || latestAssistantStreamMessage.text.trim().length === 0)

  return (
    <View style={styles.root}>
      {showExportButton ? (
        <View style={styles.headerRow}>
          <View style={styles.headerActions}>
            <Pressable onPress={() => void handleExportWord()} style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHover : undefined]}>
              {isExporting ? <ActivityIndicator size="small" color="#007ACF" /> : <View style={styles.exportButtonContent}><ReportUwvLogoIcon /><Text isSemibold style={styles.exportButtonText}>Exporteer naar Word</Text></View>}
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.bodyRow}>
        <ScrollView style={styles.fieldsColumn} contentContainerStyle={styles.fieldsContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            const isCollapsed = collapsedBySectionKey[section.key] ?? isDefaultCollapsedSection(section.title)
            return (
              <View key={section.key} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text isBold style={styles.sectionTitle}>{section.key}. {section.title}</Text>
                  <View style={styles.sectionHeaderRight}>
                    <View style={[styles.sectionBadge, section.status === 'complete' ? styles.sectionBadgeComplete : styles.sectionBadgeIncomplete]}>
                      <Text style={[styles.sectionBadgeText, section.status === 'complete' ? styles.sectionBadgeTextComplete : styles.sectionBadgeTextIncomplete]}>{section.status === 'complete' ? 'Compleet' : 'Incompleet'}</Text>
                    </View>
                    <Pressable style={({ hovered }) => [styles.chevronWrap, hovered ? styles.chevronWrapHover : undefined]} onPressIn={() => setCollapsedBySectionKey((p) => ({ ...p, [section.key]: !isCollapsed }))}>
                      <View style={[styles.chevronIconWrap, isCollapsed ? styles.chevronCollapsed : styles.chevronExpanded]}>
                        <ChevronDownIcon color="#344054" size={16} />
                      </View>
                    </Pressable>
                  </View>
                </View>
                <View style={[styles.sectionContentWrap, isCollapsed ? styles.sectionContentWrapCollapsed : styles.sectionContentWrapExpanded]} pointerEvents={isCollapsed ? 'none' : 'auto'}>
                  {section.fields.map((field) => (
                    (() => {
                    const value = getCurrentAnswer(field.sourceFieldId)
                    const label = field.numberKey === '4.1' ? 'Wat is het ordernummer?' : field.label

                    if (field.variant === 'split_name') {
                      const textValue = answerToText(value)
                      const split = decomposeNameField(textValue)
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                          <View style={styles.nameRow}>
                            <TextInput
                              value={split.initials}
                              onChangeText={(next) => {
                                const nextInitials = formatInitialsForEditing(next, split.initials)
                                setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: composeNameField(nextInitials, split.surname, false) }))
                              }}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.nameField, webNoOutlineInputStyle]}
                              placeholder="Voorletters"
                              placeholderTextColor="#98A2B3"
                              autoCapitalize="characters"
                            />
                            <TextInput
                              value={split.surname}
                              onChangeText={(next) => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: composeNameField(split.initials, capitalizeFirstLetter(next), false) }))}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.nameField, webNoOutlineInputStyle]}
                              placeholder="Achternaam"
                              placeholderTextColor="#98A2B3"
                            />
                          </View>
                        </View>
                      )
                    }

                    if (field.variant === 'split_address') {
                      const parsed = parsePostcodePlace(answerToText(value))
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} Postcode en plaats</Text>
                          <View style={styles.activityRow}>
                            <TextInput
                              value={parsed.postcode}
                              onChangeText={(next) => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: joinPostcodePlace(next, parsed.place) }))}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.postcodeInput, webNoOutlineInputStyle]}
                              placeholder="Postcode"
                              placeholderTextColor="#98A2B3"
                            />
                            <TextInput
                              value={parsed.place}
                              onChangeText={(next) => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: joinPostcodePlace(parsed.postcode, next) }))}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, styles.activityInputLarge, webNoOutlineInputStyle]}
                              placeholder="Plaats"
                              placeholderTextColor="#98A2B3"
                            />
                          </View>
                        </View>
                      )
                    }

                    if (field.variant === 'multi_select_numeric') {
                      const current = asObject(value)
                      const selected = Array.isArray(current?.keuzes) ? current.keuzes.filter((v) => typeof v === 'number') as number[] : []
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                          <View style={styles.multichoiceWrap}>
                            {REINTEGRATIE_ACTIVITEITEN_OPTIES.map((option, index) => {
                              const optionValue = index + 1
                              const isSelected = selected.includes(optionValue)
                              return (
                                <Pressable
                                  key={`${field.key}-${optionValue}`}
                                  style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  onPress={() => {
                                    const next = new Set(selected)
                                    if (next.has(optionValue)) next.delete(optionValue)
                                    else next.add(optionValue)
                                    setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { keuzes: Array.from(next).sort((a, b) => a - b) } }))
                                  }}
                                >
                                  <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                    {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                  </View>
                                  <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{optionValue}. {option}</Text>
                                </Pressable>
                              )
                            })}
                          </View>
                        </View>
                      )
                    }

                    if (field.variant === 'activities_rows') {
                      const objectValue = asObject(value) || {}
                      const activiteiten = Array.isArray(objectValue.activiteiten) ? objectValue.activiteiten : []
                      const rows = repeatableRowsByFieldId[field.sourceFieldId] ?? (activiteiten.length ? activiteiten.map((item) => {
                        const row = asObject(item as JsonValue) || {}
                        return makeActivityRow(String(row.activiteit || ''), String(row.uren ?? ''))
                      }) : [makeActivityRow()])
                      const applyRows = (nextRows: Array<{ id: string; activity: string; hours: string }>) => {
                        setRepeatableRowsByFieldId((p) => ({ ...p, [field.sourceFieldId]: nextRows }))
                        setDraftByFieldId((p) => ({
                          ...p,
                          [field.sourceFieldId]: {
                            activiteiten: nextRows
                              .map((row) => ({ activiteit: row.activity.trim(), uren: Number(normalizeNumericInput(row.hours) || 0) }))
                              .filter((row) => row.activiteit.length > 0 || row.uren > 0),
                          },
                        }))
                      }
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                          <View style={styles.activityRowsWrap}>
                            {rows.map((row, rowIndex) => {
                              const isLastRow = rowIndex === rows.length - 1
                              return (
                              <View key={row.id} style={styles.activityRow}>
                                <TextInput
                                  value={row.activity}
                                  onChangeText={(next) => applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, activity: next } : entry)))}
                                  multiline
                                  scrollEnabled={false}
                                  onContentSizeChange={(event) => setInputHeight(`${field.key}-activity-${row.id}`, event.nativeEvent.contentSize.height, ONE_LINE_HEIGHT)}
                                  style={[styles.answerInput, { height: inputHeightByFieldKey[`${field.key}-activity-${row.id}`] || ONE_LINE_HEIGHT, textAlignVertical: 'top' as any }, styles.activityInputLarge, webNoOutlineInputStyle]}
                                  placeholder="Activiteit"
                                  placeholderTextColor="#98A2B3"
                                />
                                <TextInput
                                  value={row.hours}
                                  onChangeText={(next) => applyRows(rows.map((entry) => (entry.id === row.id ? { ...entry, hours: normalizeNumericInput(next) } : entry)))}
                                  multiline={false}
                                  keyboardType="number-pad"
                                  style={[styles.answerInput, styles.activityInputSmall, webNoOutlineInputStyle]}
                                  placeholder="Uren"
                                  placeholderTextColor="#98A2B3"
                                />
                                {isLastRow ? (
                                  <Pressable
                                    style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                    onPress={() => applyRows([...rows, makeActivityRow()])}
                                  >
                                    <PlusIcon size={18} color="#344054" />
                                  </Pressable>
                                ) : null}
                                {rows.length > 1 && !isLastRow ? (
                                  <Pressable
                                    style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                    onPress={() => applyRows(rows.filter((entry) => entry.id !== row.id))}
                                  >
                                    <View style={styles.removeRowIconWrap}>
                                      <PlusIcon size={18} color="#98A2B3" />
                                    </View>
                                  </Pressable>
                                ) : null}
                              </View>
                            )})}
                          </View>
                        </View>
                      )
                    }

                    if (field.variant === 'maanden_object') {
                      const current = asObject(value) || {}
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                          <TextInput
                            value={String(current.maanden ?? '')}
                            onChangeText={(next) => {
                              const numeric = normalizeNumericInput(next)
                              setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { maanden: numeric.length ? Number(numeric) : '' } }))
                            }}
                            multiline={false}
                            keyboardType="number-pad"
                            style={[styles.answerInput, styles.programmaticHeight, webNoOutlineInputStyle]}
                            placeholder=""
                          />
                        </View>
                      )
                    }

                    if (field.variant === 'uren_motivering' || field.variant === 'tarief_motivering') {
                      const current = asObject(value) || {}
                      const numberKey = field.variant === 'uren_motivering' ? 'uren' : 'tarief'
                      return (
                        <View key={field.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                          <TextInput
                            value={String(current[numberKey] ?? '')}
                            onChangeText={(next) => {
                              const numeric = normalizeNumericInput(next)
                              setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...current, [numberKey]: numeric.length ? Number(numeric) : '' } }))
                            }}
                            multiline={false}
                            keyboardType="number-pad"
                            style={[styles.answerInput, styles.programmaticHeight, webNoOutlineInputStyle]}
                            placeholder={numberKey === 'uren' ? 'Aantal uren' : 'Tarief'}
                            placeholderTextColor="#98A2B3"
                          />
                          <TextInput
                            value={String(current.motivering ?? '')}
                            onChangeText={(next) => setDraftByFieldId((p) => ({ ...p, [field.sourceFieldId]: { ...current, motivering: next } }))}
                            multiline
                            scrollEnabled={false}
                            onContentSizeChange={(event) => setInputHeight(`${field.key}-motivering`, event.nativeEvent.contentSize.height)}
                            style={[styles.answerInput, { minHeight: inputHeightByFieldKey[`${field.key}-motivering`] || FIVE_LINE_HEIGHT }, webNoOutlineInputStyle]}
                            placeholder="Motivering"
                            placeholderTextColor="#98A2B3"
                          />
                        </View>
                      )
                    }

                    const textValue = answerToText(value)
                    const isOneLine = field.fieldType === 'programmatic' || field.numberKey === '1.2'
                    return (
                      <View key={field.key} style={styles.fieldBlock}>
                        <Text isSemibold style={styles.fieldLabel}>{field.numberKey} {label}</Text>
                        <TextInput
                          value={textValue}
                          onChangeText={(next) =>
                            setDraftByFieldId((p) => ({
                              ...p,
                              [field.sourceFieldId]: field.numberKey === '1.2' ? normalizeNumericInput(next) : next,
                            }))
                          }
                          multiline={!isOneLine}
                          scrollEnabled={isOneLine ? undefined : false}
                          keyboardType={field.numberKey === '1.2' ? 'number-pad' : undefined}
                          inputMode={field.numberKey === '1.2' ? 'numeric' : undefined}
                          onContentSizeChange={!isOneLine ? (event) => setInputHeight(field.key, event.nativeEvent.contentSize.height) : undefined}
                          style={[
                            styles.answerInput,
                            isOneLine ? styles.programmaticHeight : { minHeight: inputHeightByFieldKey[field.key] || FIVE_LINE_HEIGHT, textAlignVertical: 'top' as any },
                            webNoOutlineInputStyle,
                          ]}
                          placeholder={field.numberKey === '6.1' ? '' : 'Typ hier het antwoord...'}
                          placeholderTextColor="#98A2B3"
                        />
                      </View>
                    )
                  })()
                  ))}
                </View>
              </View>
            )
          })}
        </ScrollView>

        <View style={styles.chatColumn}>
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Text isSemibold style={styles.chatTitle}>Rapport Chat</Text>
              {chatRows.length > 0 ? (
                <Pressable
                  onPress={() => {
                    setChatRows([])
                    setChatMessage('')
                  }}
                  style={({ hovered }) => [styles.chatClearButton, hovered ? styles.chatClearButtonHover : undefined]}
                >
                  <Text isSemibold style={styles.chatClearButtonText}>Wissen</Text>
                </Pressable>
              ) : null}
            </View>
            <ScrollView style={styles.chatMessages} contentContainerStyle={styles.chatMessagesContent}>
              {chatRows.map((row) => {
                const isHiddenStreamingPlaceholder = row.role === 'assistant' && row.text.trim().length === 0
                if (isHiddenStreamingPlaceholder) return null
                return <ChatMessage key={row.id} role={row.role} text={row.text} />
              })}
              {shouldShowChatLoading
                ? <ChatMessage role="assistant" text="" isLoading />
                : null}
            </ScrollView>
            <View style={styles.chatComposerWrap}>
              <ChatComposer value={chatMessage} onChangeValue={setChatMessage} onSend={() => void handleSendChat()} showDisclaimer={false} sendIconVariant="arrow" isSendDisabled={isChatSending || chatMessage.trim().length === 0} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 8, paddingHorizontal: 0, paddingBottom: 24, backgroundColor: '#F7F5F8' },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  exportButton: { borderWidth: 1, borderColor: '#007ACF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  exportButtonHover: { backgroundColor: '#EFF7FF' },
  exportButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportButtonText: { color: '#007ACF' },
  bodyRow: { flex: 1, flexDirection: 'row', gap: 16 },
  fieldsColumn: { flex: 1 },
  fieldsContent: { gap: 10, paddingBottom: 14 },
  sectionCard: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  sectionHeader: { minHeight: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, color: '#2C111F' },
  sectionBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  sectionBadgeComplete: { backgroundColor: '#D4FDE5' },
  sectionBadgeIncomplete: { backgroundColor: '#FEE2E2' },
  sectionBadgeText: { fontSize: 12 },
  sectionBadgeTextComplete: { color: '#008234' },
  sectionBadgeTextIncomplete: { color: '#B91C1C' },
  chevronWrap: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chevronWrapHover: { backgroundColor: '#E7EAF0' },
  chevronIconWrap: { transitionProperty: 'transform', transitionDuration: '220ms', transitionTimingFunction: 'ease' } as any,
  chevronCollapsed: { transform: [{ rotate: '0deg' }] },
  chevronExpanded: { transform: [{ rotate: '180deg' }] },
  sectionContentWrap: { overflow: 'hidden', transitionProperty: 'max-height, opacity, padding-top', transitionDuration: '200ms', transitionTimingFunction: 'ease' } as any,
  sectionContentWrapCollapsed: { maxHeight: 0, opacity: 0, paddingTop: 0 },
  sectionContentWrapExpanded: { maxHeight: 900, opacity: 1, paddingTop: 4 },
  fieldBlock: { gap: 8, marginTop: 4 },
  fieldLabel: { fontSize: 13, color: '#344054' },
  nameRow: { flexDirection: 'row', gap: 8 },
  nameField: { flex: 1 },
  answerInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#fff' },
  programmaticHeight: { minHeight: ONE_LINE_HEIGHT },
  fiveLineHeight: { minHeight: FIVE_LINE_HEIGHT, textAlignVertical: 'top' as any },
  multichoiceWrap: { gap: 8 },
  choiceRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 8 },
  choiceRowHovered: { backgroundColor: '#F8FAFC' },
  choiceSquare: { width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0, borderRadius: 4, borderWidth: 1, borderColor: '#B7BCC5', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  choiceSquareSelected: { borderColor: '#BE0165' },
  choiceSquareInner: { width: 10, height: 10, borderRadius: 2, backgroundColor: '#BE0165' },
  choiceRowText: { fontSize: 14, color: '#2C111F' },
  choiceRowTextSelected: { color: '#BE0165' },
  activityRowsWrap: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  activityInputLarge: { flex: 1 },
  activityInputSmall: { width: HOUR_INPUT_SIZE, minHeight: ONE_LINE_HEIGHT, textAlign: 'center' as any, textAlignVertical: 'center' as any },
  postcodeInput: { width: 120 },
  rowActionButton: { width: ROW_ACTION_SIZE, height: ROW_ACTION_SIZE, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rowActionButtonHover: { backgroundColor: '#EEF2F7' },
  removeRowIconWrap: { transform: [{ rotate: '45deg' }] },
  chatColumn: { width: 400 },
  chatCard: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden' },
  chatHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatTitle: { fontSize: 16, color: '#2C111F' },
  chatClearButton: { minHeight: 24, justifyContent: 'center' },
  chatClearButtonHover: { opacity: 0.7 },
  chatClearButtonText: { fontSize: 13, lineHeight: 16, color: '#344054' },
  chatMessages: { flex: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chatMessagesContent: { gap: 10, paddingBottom: 6 },
  chatComposerWrap: { padding: 10 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#2C111F' },
})

