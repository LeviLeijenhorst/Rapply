import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { ChevronDownIcon } from '@/icons/ChevronDownIcon'
import { PlusIcon } from '@/icons/PlusIcon'
import { ReportUwvLogoIcon } from '@/icons/ReportScreenIcons'
import { readPipelineReport, saveReportFieldEdit, sendReportPipelineChatMessage, type PipelineTemplate } from '@/api/pipeline/pipelineApi'
import { exportReportToWord } from '@/api/reports/exportReportToWord'
import { buildStructuredExportContext, buildStructuredReportText } from '@/screens/report/structuredReportExport'
import { hasChatFieldUpdates, readFieldOrder } from '@/screens/report/reportEditorLogic'
import {
  capitalizeFirstLetter,
  composeNameField,
  decomposeNameField,
  deserializeMultiSelect,
  deserializeRepeatableRows,
  formatInitialsForEditing,
  isDefaultCollapsedSection,
  normalizeNumericInput,
  readDefaultSectionTitle,
  readNumberFromLabel,
  REINTEGRATIE_ACTIVITEITEN_OPTIES,
  serializeMultiSelectDeterministic,
  serializeRepeatableRows,
  stripNumberPrefix,
} from '@/screens/report/reportEditorFieldUi'
import { ChatComposer } from '@/screens/shared/components/chat/ChatComposer'
import { ChatMessage } from '@/screens/shared/components/chat/ChatMessage'
import type { Report, ReportFieldType } from '@/storage/types'
import { useToast } from '@/toast/ToastProvider'
import { Text } from '@/ui/Text'

type Props = {
  report: Report
  templates: PipelineTemplate[]
  onReportUpdated: (report: Report) => void
}

type ChatRow = { id: string; role: 'user' | 'assistant'; text: string }

type RenderField = {
  key: string
  sourceFieldId: string
  numberKey: string
  label: string
  fieldType: ReportFieldType
  variant: 'default' | 'name_initials' | 'name_surname' | 'postcode' | 'place' | 'multi_select' | 'repeatable_rows'
}

type RenderSection = {
  key: string
  title: string
  fields: RenderField[]
  status: 'complete' | 'incomplete'
}

const webNoOutlineInputStyle = { outlineStyle: 'none', outlineWidth: 0, resize: 'none' } as any
const webScrollableMultilineInputStyle = { overflow: 'auto' } as any
const FIVE_LINE_HEIGHT = 120
const ONE_LINE_HEIGHT = 38
const ACTIVITY_INPUT_BASE_HEIGHT = 45
const HOUR_INPUT_SIZE = 44
const ACTIVITY_INPUT_MAX_HEIGHT = 220
function RefreshIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 20 20" fill="none">
      <Path d="M16.5 3.5V7h-3.5" stroke="#344054" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 16.5V13h3.5" stroke="#344054" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5.4 8.1A6 6 0 0 1 15 6.2L16.5 7" stroke="#344054" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14.6 11.9A6 6 0 0 1 5 13.8L3.5 13" stroke="#344054" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function parsePostcodePlace(value: string): { postcode: string; place: string } {
  const text = String(value || '').trim()
  const match = text.match(/(\d{4}\s?[A-Za-z]{2})\s*(.*)$/)
  if (!match) return { postcode: '', place: text }
  return {
    postcode: String(match[1] || '').toUpperCase().replace(/\s+/g, ''),
    place: String(match[2] || '').trim(),
  }
}

function joinPostcodePlace(postcode: string, place: string): string {
  const cleanPostcode = String(postcode || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const cleanPlace = String(place || '').trim()
  return `${cleanPostcode} ${cleanPlace}`.trim()
}

function estimateRepeatableActivityHeight(value: string): number {
  const text = String(value || '')
  if (!text) return ACTIVITY_INPUT_BASE_HEIGHT
  const approxCharsPerLine = 44
  const explicitLines = text.split('\n')
  let totalLines = 0
  for (const line of explicitLines) totalLines += Math.max(1, Math.ceil(line.length / approxCharsPerLine))
  const estimated = ACTIVITY_INPUT_BASE_HEIGHT + Math.max(0, totalLines - 1) * 20
  return Math.min(ACTIVITY_INPUT_MAX_HEIGHT, estimated)
}
function estimateMultilineHeight(value: string, baseHeight: number): number {
  const text = String(value || '')
  if (!text) return baseHeight
  const approxCharsPerLine = 64
  const explicitLines = text.split('\n')
  let totalLines = 0
  for (const line of explicitLines) totalLines += Math.max(1, Math.ceil(line.length / approxCharsPerLine))
  const estimated = baseHeight + Math.max(0, totalLines - 5) * 20
  return Math.min(420, estimated)
}

function toDisplayNumber(numberKey: string, sectionKey: string): string {
  if (sectionKey !== '8') return numberKey
  const match = String(numberKey || '').match(/^8\.(\d+)$/)
  if (!match) return numberKey
  return `8.${Number(match[1]) + 1}`
}

export function ReportEditorPanel({ report, templates, onReportUpdated }: Props) {
  const { showErrorToast, showToast } = useToast()
  const [draftByFieldId, setDraftByFieldId] = useState<Record<string, string>>({})
  const [savingFieldId, setSavingFieldId] = useState<string | null>(null)
  const [collapsedBySectionKey, setCollapsedBySectionKey] = useState<Record<string, boolean>>({})
  const [isExporting, setIsExporting] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatRows, setChatRows] = useState<ChatRow[]>([])
  const [isChatSending, setIsChatSending] = useState(false)
  const [repeatableRowsByFieldId, setRepeatableRowsByFieldId] = useState<Record<string, Array<{ hours: string; activity: string }>>>({})
  const [splitNameDraftByFieldId, setSplitNameDraftByFieldId] = useState<Record<string, { initials: string; surname: string }>>({})
  const [specialistTariffBySection, setSpecialistTariffBySection] = useState<Record<string, 'ja' | 'nee' | ''>>({})

  const structured = report.reportStructuredJson
  const template = useMemo(() => templates.find((item) => item.id === structured?.templateId) ?? null, [structured?.templateId, templates])
  const orderedFieldIds = useMemo(() => readFieldOrder(report, template), [report, template])

  const sections = useMemo<RenderSection[]>(() => {
    if (!structured) return []
    const grouped = new Map<string, RenderField[]>()

    for (const fieldId of orderedFieldIds) {
      const source = structured.fields[fieldId]
      if (!source) continue
      const numberKey = template?.fields.find((f) => f.fieldId === fieldId)?.exportNumberKey || readNumberFromLabel(source.label)
      const sectionKey = (numberKey.split('.')[0] || '0').trim() || '0'
      if (sectionKey === '9' || numberKey === '8.3') continue

      let label = stripNumberPrefix(source.label) || source.label
      if (numberKey === '8.2') label = 'Motivering'

      const variant: RenderField['variant'] =
        numberKey === '5.1'
          ? 'multi_select'
          : numberKey === '5.3'
            ? 'repeatable_rows'
            : numberKey === '1.1'
              ? 'default'
              : numberKey === '3.4'
                ? 'default'
                : 'default'

      const entries: RenderField[] =
        numberKey === '1.1'
          ? [
              { key: `${fieldId}__initials`, sourceFieldId: fieldId, numberKey, label: 'Voorletters', fieldType: source.fieldType, variant: 'name_initials' },
              { key: `${fieldId}__surname`, sourceFieldId: fieldId, numberKey, label: 'Achternaam', fieldType: source.fieldType, variant: 'name_surname' },
            ]
          : numberKey === '3.4'
            ? [
                { key: `${fieldId}__postcode`, sourceFieldId: fieldId, numberKey, label: 'Postcode', fieldType: source.fieldType, variant: 'postcode' },
                { key: `${fieldId}__place`, sourceFieldId: fieldId, numberKey, label: 'Plaats', fieldType: source.fieldType, variant: 'place' },
              ]
            : [{ key: fieldId, sourceFieldId: fieldId, numberKey, label, fieldType: source.fieldType, variant }]

      if (!grouped.has(sectionKey)) grouped.set(sectionKey, [])
      grouped.get(sectionKey)?.push(...entries)
    }

    return Array.from(grouped.entries()).map(([key, fields]) => {
      const title = readDefaultSectionTitle(key, fields[0]?.label || '')

      const visibleFields =
        key === '8' && specialistTariffBySection[key] === 'nee'
          ? fields.filter((field) => !(field.numberKey === '8.1' || field.numberKey === '8.2'))
          : fields

      const answered = visibleFields.filter((field) => {
        const rawAnswer = String((draftByFieldId[field.sourceFieldId] ?? structured.fields[field.sourceFieldId]?.answer) || '').trim()
        if (!rawAnswer) return false
        if (field.variant === 'multi_select') return deserializeMultiSelect(rawAnswer).length > 0
        if (field.variant === 'repeatable_rows') return deserializeRepeatableRows(rawAnswer).some((row) => String(row.activity || '').trim() || String(row.hours || '').trim())
        return true
      }).length

      let status: RenderSection['status'] = answered === visibleFields.length && visibleFields.length > 0 ? 'complete' : 'incomplete'
      if (key === '8') {
        if (specialistTariffBySection[key] === 'nee') status = 'complete'
        else if (specialistTariffBySection[key] !== 'ja') status = 'incomplete'
      }
      return { key, title, fields, status }
    })
  }, [orderedFieldIds, structured, template, draftByFieldId, specialistTariffBySection])


  React.useEffect(() => {
    setSplitNameDraftByFieldId({})
  }, [report.id])
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
      const current = String(structured.fields[fieldId]?.answer || '')
      if (current.trim() === String(nextValue).trim()) continue
      timers.push(
        setTimeout(() => {
          void handleSaveField(fieldId, nextValue)
        }, 700),
      )
    }
    return () => timers.forEach(clearTimeout)
  }, [draftByFieldId, structured])

  function updateSplitName(sourceFieldId: string, next: { initials?: string; surname?: string }) {
    const currentAnswer = String((draftByFieldId[sourceFieldId] ?? structured?.fields[sourceFieldId]?.answer) || '')
    const currentSplit = splitNameDraftByFieldId[sourceFieldId] || decomposeNameField(currentAnswer)
    const nextSplit = {
      initials: next.initials ?? currentSplit.initials,
      surname: next.surname ?? currentSplit.surname,
    }
    const merged = composeNameField(nextSplit.initials, nextSplit.surname, false)
    setSplitNameDraftByFieldId((prev) => ({ ...prev, [sourceFieldId]: nextSplit }))
    setDraftByFieldId((prev) => ({ ...prev, [sourceFieldId]: merged }))
  }

  function updateSplitPostcodePlace(sourceFieldId: string, next: { postcode?: string; place?: string }) {
    const currentAnswer = String((draftByFieldId[sourceFieldId] ?? structured?.fields[sourceFieldId]?.answer) || '')
    const split = parsePostcodePlace(currentAnswer)
    const merged = joinPostcodePlace(next.postcode ?? split.postcode, next.place ?? split.place)
    setDraftByFieldId((prev) => ({ ...prev, [sourceFieldId]: merged }))
  }

  async function handleSaveField(fieldId: string, answer: string) {
    setSavingFieldId(fieldId)
    try {
      const response = await saveReportFieldEdit({ reportId: report.id, fieldId, answer: String(answer || '').trim() })
      onReportUpdated(response.report)
      setDraftByFieldId((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Veld opslaan mislukt.')
    } finally {
      setSavingFieldId(null)
    }
  }

  async function handleSendChat() {
    const trimmed = chatMessage.trim()
    if (!trimmed || isChatSending) return
    const nextRows = [...chatRows, { id: `user-${Date.now()}`, role: 'user' as const, text: trimmed }]
    setChatRows(nextRows)
    setChatMessage('')
    setIsChatSending(true)
    try {
      const response = await sendReportPipelineChatMessage({
        reportId: report.id,
        messages: nextRows.map((row) => ({ role: row.role, text: row.text })),
      })
      setChatRows((prev) => [...prev, { id: `assistant-${Date.now()}`, role: 'assistant', text: response.answer || 'Geen antwoord ontvangen.' }])
      if (hasChatFieldUpdates(response)) {
        const refreshed = await readPipelineReport(report.id)
        if (refreshed) onReportUpdated(refreshed)
      }
    } catch (error) {
      setChatRows((prev) => [...prev, { id: `assistant-error-${Date.now()}`, role: 'assistant', text: error instanceof Error ? error.message : 'Chat mislukt.' }])
    } finally {
      setIsChatSending(false)
    }
  }

  async function handleExportWord() {
    if (!structured || !template) return
    setIsExporting(true)
    try {
      const didExport = await exportReportToWord({
        templateName: template.name,
        reportText: buildStructuredReportText(template, structured),
        contextValues: buildStructuredExportContext(template, structured),
      })
      if (!didExport) showErrorToast('Geen ondersteund UWV-template gevonden voor export.')
      else showToast('Word-export gestart.')
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : 'Word-export mislukt.')
    } finally {
      setIsExporting(false)
    }
  }

  if (!structured) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Structured report data ontbreekt voor dit rapport.</Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <View style={styles.headerMeta}>
            <Text isBold style={styles.title}>{report.title || template?.name || 'Rapport'}</Text>
          </View>
          <View style={styles.headerActions}>
            {savingFieldId ? <ActivityIndicator size="small" color="#475467" /> : null}
            <Pressable onPress={() => void handleExportWord()} style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHover : undefined]}>
              {isExporting ? <ActivityIndicator size="small" color="#007ACF" /> : <View style={styles.exportButtonContent}><ReportUwvLogoIcon /><Text isSemibold style={styles.exportButtonText}>Exporteer naar Word</Text></View>}
            </Pressable>
          </View>
        </View>
        <View pointerEvents="none" style={styles.headerFade} />
      </View>

      <View style={styles.bodyRow}>
        <ScrollView style={styles.fieldsColumn} contentContainerStyle={styles.fieldsContent} showsVerticalScrollIndicator={false}>
          {sections.map((section) => {
            const isCollapsed = collapsedBySectionKey[section.key] ?? isDefaultCollapsedSection(section.title)
            const visibleFields =
              section.key === '8' && specialistTariffBySection[section.key] === 'nee'
                ? section.fields.filter((field) => !(field.numberKey === '8.1' || field.numberKey === '8.2'))
                : section.fields

            return (
              <View key={section.key} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text isBold style={styles.sectionTitle}>{section.key}. {section.title}</Text>
                  <View style={styles.sectionHeaderRight}>
                    <View style={[styles.sectionBadge, section.status === 'complete' ? styles.sectionBadgeComplete : styles.sectionBadgeIncomplete]}>
                      <Text style={[styles.sectionBadgeText, section.status === 'complete' ? styles.sectionBadgeTextComplete : styles.sectionBadgeTextIncomplete]}>
                        {section.status === 'complete' ? 'Compleet' : 'Incompleet'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setCollapsedBySectionKey((p) => ({ ...p, [section.key]: !isCollapsed }))}
                      style={({ hovered }) => [
                        styles.chevronWrap,
                        hovered ? styles.chevronWrapHover : undefined,
                        { transform: [{ rotate: isCollapsed ? '0deg' as const : '180deg' as const }] } as any,
                      ]}
                    >
                      <ChevronDownIcon color="#344054" size={16} />
                    </Pressable>
                  </View>
                </View>

                {isCollapsed ? null : (
                  <>
                    {section.key === '8' ? (
                      <View style={styles.fieldBlock}>
                        <Text isSemibold style={styles.fieldLabel}>8.1 Is er sprake van specialistisch uurtarief?</Text>
                        <View style={styles.multichoiceWrap}>
                          {(['ja', 'nee'] as const).map((option) => {
                            const selected = specialistTariffBySection[section.key] === option
                            return (
                              <Pressable key={option} onPress={() => setSpecialistTariffBySection((p) => ({ ...p, [section.key]: option }))} style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}>
                                <View style={[styles.choiceSquare, selected ? styles.choiceSquareSelected : undefined]}>
                                  {selected ? <View style={styles.choiceSquareInner} /> : null}
                                </View>
                                <Text style={[styles.choiceRowText, selected ? styles.choiceRowTextSelected : undefined]}>{option.toUpperCase()}</Text>
                              </Pressable>
                            )
                          })}
                        </View>
                      </View>
                    ) : null}

                    {visibleFields.map((item) => {
                      const field = structured.fields[item.sourceFieldId]
                      const value = draftByFieldId[item.sourceFieldId] ?? String(field.answer || '')
                      const displayNumber = toDisplayNumber(item.numberKey, section.key)

                      if (item.variant === 'multi_select') {
                        const selected = new Set(deserializeMultiSelect(value))
                        return (
                          <View key={item.key} style={styles.fieldBlock}>
                            <Text isSemibold style={styles.fieldLabel}>{displayNumber} {item.label}</Text>
                            <View style={styles.multichoiceWrap}>
                              {REINTEGRATIE_ACTIVITEITEN_OPTIES.map((option) => {
                                const isSelected = selected.has(option)
                                return (
                                  <Pressable
                                    key={option}
                                    onPress={() => {
                                      const next = new Set(deserializeMultiSelect(value))
                                      if (next.has(option)) next.delete(option)
                                      else next.add(option)
                                      setDraftByFieldId((p) => ({ ...p, [item.sourceFieldId]: serializeMultiSelectDeterministic(Array.from(next)) }))
                                    }}
                                    style={({ hovered }) => [styles.choiceRow, hovered ? styles.choiceRowHovered : undefined]}
                                  >
                                    <View style={[styles.choiceSquare, isSelected ? styles.choiceSquareSelected : undefined]}>
                                      {isSelected ? <View style={styles.choiceSquareInner} /> : null}
                                    </View>
                                    <Text style={[styles.choiceRowText, isSelected ? styles.choiceRowTextSelected : undefined]}>{option}</Text>
                                  </Pressable>
                                )
                              })}
                            </View>
                          </View>
                        )
                      }

                      if (item.variant === 'repeatable_rows') {
                        const rows = repeatableRowsByFieldId[item.sourceFieldId] || deserializeRepeatableRows(value)
                        return (
                          <View key={item.key} style={styles.fieldBlock}>
                            <Text isSemibold style={styles.fieldLabel}>{displayNumber} {item.label}</Text>
                            <View style={styles.activityRowsWrap}>
                              {rows.map((row, index) => {
                                const rowHeight = estimateRepeatableActivityHeight(row.activity)
                                return (
                                  <View key={`${item.key}-${index}`} style={styles.activityRow}>
                                    <TextInput
                                      value={row.activity}
                                      onChangeText={(next) => {
                                        const nextRows = [...rows]
                                        nextRows[index] = { ...nextRows[index], activity: next }
                                        setRepeatableRowsByFieldId((p) => ({ ...p, [item.sourceFieldId]: nextRows }))
                                        setDraftByFieldId((p) => ({ ...p, [item.sourceFieldId]: serializeRepeatableRows(nextRows) }))
                                      }}

                                      multiline
                                      scrollEnabled={rowHeight >= ACTIVITY_INPUT_MAX_HEIGHT}
                                      style={[
                                        styles.answerInput,
                                        styles.activityInputLarge,
                                        { height: rowHeight, maxHeight: ACTIVITY_INPUT_MAX_HEIGHT },
                                        rowHeight >= ACTIVITY_INPUT_MAX_HEIGHT ? webScrollableMultilineInputStyle : undefined,
                                        webNoOutlineInputStyle,
                                      ]}
                                      placeholder="Re-integratieactiviteit"
                                      placeholderTextColor="#8E8480"
                                    />
                                    <TextInput
                                      value={row.hours}
                                      onChangeText={(next) => {
                                        const nextRows = [...rows]
                                        nextRows[index] = { ...nextRows[index], hours: normalizeNumericInput(next) }
                                        setRepeatableRowsByFieldId((p) => ({ ...p, [item.sourceFieldId]: nextRows }))
                                        setDraftByFieldId((p) => ({ ...p, [item.sourceFieldId]: serializeRepeatableRows(nextRows) }))
                                      }}
                                      keyboardType="number-pad"
                                      inputMode="numeric"
                                      style={[styles.answerInput, styles.activityInputSmall, webNoOutlineInputStyle]}
                                      placeholder="uur"
                                      placeholderTextColor="#8E8480"
                                    />
                                    <Pressable
                                      onPress={() => {
                                        const nextRows = [...rows]
                                        if (index === rows.length - 1) nextRows.push({ hours: '', activity: '' })
                                        else nextRows.splice(index, 1)
                                        setRepeatableRowsByFieldId((p) => ({ ...p, [item.sourceFieldId]: nextRows }))
                                        setDraftByFieldId((p) => ({ ...p, [item.sourceFieldId]: serializeRepeatableRows(nextRows) }))
                                      }}
                                      style={({ hovered }) => [styles.rowActionButton, hovered ? styles.rowActionButtonHover : undefined]}
                                    >
                                      <View style={index === rows.length - 1 ? undefined : styles.removeRowIconWrap}>
                                        <PlusIcon color="#374151" size={16} />
                                      </View>
                                    </Pressable>
                                  </View>
                                )
                              })}
                            </View>
                          </View>
                        )
                      }

                      if (item.variant === 'name_initials' || item.variant === 'name_surname') {
                        const split = splitNameDraftByFieldId[item.sourceFieldId] || decomposeNameField(value)
                        const splitValue = item.variant === 'name_initials' ? split.initials : split.surname
                        return (
                          <View key={item.key} style={styles.fieldBlock}>
                            <Text isSemibold style={styles.fieldLabel}>{displayNumber} {item.label}</Text>
                            <TextInput
                              value={splitValue}
                              onChangeText={(next) => {
                                if (item.variant === 'name_initials') {
                                  const formattedInitials = formatInitialsForEditing(next, split.initials)
                                  updateSplitName(item.sourceFieldId, { initials: formattedInitials })
                                  return
                                }
                                updateSplitName(item.sourceFieldId, { surname: capitalizeFirstLetter(next) })
                              }}
                              multiline={false}
                              style={[styles.answerInput, styles.programmaticHeight, webNoOutlineInputStyle]}
                              placeholder="Typ hier..."
                              placeholderTextColor="#8A8F99"
                            />
                          </View>
                        )
                      }

                      if (item.variant === 'postcode' || item.variant === 'place') {
                        const split = parsePostcodePlace(value)
                        const splitValue = item.variant === 'postcode' ? split.postcode : split.place
                        return (
                          <View key={item.key} style={styles.fieldBlock}>
                            <Text isSemibold style={styles.fieldLabel}>{displayNumber} {item.label}</Text>
                            <TextInput
                              value={splitValue}
                              onChangeText={(next) => updateSplitPostcodePlace(item.sourceFieldId, item.variant === 'postcode' ? { postcode: next } : { place: next })}
                              multiline={false}
                              style={[styles.answerInput, item.fieldType === 'programmatic' ? styles.programmaticHeight : styles.fiveLineHeight, webNoOutlineInputStyle]}
                              placeholder="Typ hier..."
                              placeholderTextColor="#8A8F99"
                            />
                          </View>
                        )
                      }

                      const multiline = item.fieldType !== 'programmatic'
                      return (
                        <View key={item.key} style={styles.fieldBlock}>
                          <Text isSemibold style={styles.fieldLabel}>{displayNumber} {item.label}</Text>
                          <TextInput
                            value={value}
                            onChangeText={(next) =>
                              setDraftByFieldId((p) => ({
                                ...p,
                                [item.sourceFieldId]: item.numberKey === '1.2' ? normalizeNumericInput(next) : next,
                              }))
                            }
                            multiline={multiline}
                            scrollEnabled={false}
                            keyboardType={item.numberKey === '1.2' ? 'number-pad' : undefined}
                            inputMode={item.numberKey === '1.2' ? 'numeric' : undefined}
                            style={[
                              styles.answerInput,
                              multiline
                                ? [styles.fiveLineHeight, { height: estimateMultilineHeight(value, FIVE_LINE_HEIGHT) }]
                                : styles.programmaticHeight,
                              webNoOutlineInputStyle,
                            ]}
                            placeholder="Typ hier het antwoord..."
                            placeholderTextColor="#8A8F99"
                          />
                        </View>
                      )
                    })}
                  </>
                )}
              </View>
            )
          })}
        </ScrollView>

        <View style={styles.chatColumn}>
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Text isSemibold style={styles.chatTitle}>Rapport Chat</Text>
              <Text style={styles.chatSubtitle}>Chat kan AI-velden direct bijwerken.</Text>
            </View>
            <ScrollView style={styles.chatMessages} contentContainerStyle={chatRows.length === 0 ? styles.chatMessagesEmpty : styles.chatMessagesContent}>
              {chatRows.length === 0 ? <Text style={styles.chatEmptyText}>Stel een vraag over dit rapport.</Text> : chatRows.map((row) => <ChatMessage key={row.id} role={row.role} text={row.text} />)}
              {isChatSending ? <ChatMessage role="assistant" text="" isLoading /> : null}
            </ScrollView>
            <View style={styles.chatComposerWrap}>
              <ChatComposer
                value={chatMessage}
                onChangeValue={setChatMessage}
                onSend={() => void handleSendChat()}
                showDisclaimer={false}
                sendIconVariant="arrow"
                isSendDisabled={isChatSending || chatMessage.trim().length === 0}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 24, paddingHorizontal: 24, paddingBottom: 10, gap: 0, backgroundColor: '#FFFFFF' },
  headerWrap: { position: 'relative' as any, zIndex: 5, backgroundColor: '#FFFFFF' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  headerFade: { height: 26, ...( { backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)', marginBottom: -14 } as any ) },
  headerMeta: { flex: 1, gap: 4 },
  title: { fontSize: 30, lineHeight: 36, color: '#2C111F' },
  subtitle: { fontSize: 14, lineHeight: 18, color: '#7C6E76' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportButton: { minHeight: 44, borderRadius: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: '#007ACF', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  exportButtonHover: { backgroundColor: '#EFF7FF' },
  exportButtonContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportButtonText: { fontSize: 14, lineHeight: 18, color: '#007ACF' },
  bodyRow: { flex: 1, flexDirection: 'row', gap: 16, minHeight: 0, marginTop: -2 },
  fieldsColumn: { flex: 1, minWidth: 0 },
  fieldsContent: { gap: 12, paddingBottom: 0 },
  sectionCard: { borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF', padding: 16, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  sectionHeaderHover: { backgroundColor: '#F8FAFC' },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, lineHeight: 22, color: '#2C111F' },
  sectionBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  sectionBadgeComplete: { backgroundColor: '#D4FDE5' },
  sectionBadgeIncomplete: { backgroundColor: '#FEE2E2' },
  sectionBadgeText: { fontSize: 12, lineHeight: 16 },
  sectionBadgeTextComplete: { color: '#008234' },
  sectionBadgeTextIncomplete: { color: '#B91C1C' },
  chevronWrap: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chevronWrapHover: { backgroundColor: '#F2F4F7', borderWidth: 1, borderColor: '#E4E7EC' },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 13, lineHeight: 18, color: '#344054' },
  answerInput: { borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#2C111F', backgroundColor: '#FFFFFF' },
  answerInputWithRefresh: { paddingRight: 34 },
  inputWithIconWrap: { position: 'relative' as any },
  inputRefreshButton: { position: 'absolute' as any, top: 8, right: 8, width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  inputRefreshButtonHover: { backgroundColor: '#ECEFF3' },
  programmaticHeight: { minHeight: ONE_LINE_HEIGHT },
  fiveLineHeight: { minHeight: FIVE_LINE_HEIGHT, textAlignVertical: 'top' as any },
  multichoiceWrap: { flexDirection: 'column', gap: 8 },
  choiceRow: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 8, paddingHorizontal: 8 },
  choiceRowHovered: { backgroundColor: '#F8FAFC' },
  choiceSquare: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: '#B7BCC5', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  choiceSquareSelected: { borderColor: '#BE0165', backgroundColor: '#FFFFFF' },
  choiceSquareInner: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#BE0165' },
  choiceRowText: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  choiceRowTextSelected: { color: '#BE0165' },
  activityRowsWrap: { gap: 8 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  activityInputLarge: { flex: 1, paddingTop: 10, paddingBottom: 4 },
  activityInputSmall: {
    width: HOUR_INPUT_SIZE,
    height: HOUR_INPUT_SIZE,
    minHeight: HOUR_INPUT_SIZE,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginTop: 1,
    textAlign: 'center' as any,
    textAlignVertical: 'center' as any,
    fontSize: 12,
    lineHeight: 18,
  },
  currencyInputWrap: { minHeight: ONE_LINE_HEIGHT, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  currencyPrefix: { fontSize: 14, lineHeight: 18, color: '#2C111F' },
  currencyInput: { flex: 1, borderWidth: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
  rowActionButton: { width: HOUR_INPUT_SIZE, height: HOUR_INPUT_SIZE, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rowActionButtonHover: { backgroundColor: '#EEF2F7' },
  removeRowIconWrap: { transform: [{ rotate: '45deg' }] },
  chatColumn: { width: 420, minWidth: 360, maxWidth: 460 },
  chatCard: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: '#DFE0E2', backgroundColor: '#FFFFFF', overflow: 'hidden' },
  chatHeader: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 2 },
  chatTitle: { fontSize: 18, lineHeight: 22, color: '#2C111F' },
  chatSubtitle: { fontSize: 13, lineHeight: 16, color: '#7A6C75' },
  chatMessages: { flex: 1 },
  chatMessagesContent: { gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  chatMessagesEmpty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  chatEmptyText: { fontSize: 13, lineHeight: 18, color: '#7A6C75', textAlign: 'center' },
  chatComposerWrap: { paddingHorizontal: 14, paddingTop: 6, paddingBottom: 18 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontSize: 16, lineHeight: 22, color: '#2C111F', textAlign: 'center' },
})



































