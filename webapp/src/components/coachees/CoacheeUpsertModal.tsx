import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { colors } from '../../theme/colors'
import { Text } from '../Text'
import { EditActionIcon } from '../icons/EditActionIcon'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { focusAndSelectAll } from '../../utils/textInput'
import { CalendarCircleIcon } from '../icons/CalendarCircleIcon'
import type { CoacheeUpsertValues } from '../../utils/coacheeProfile'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  initialValues: CoacheeUpsertValues
  onClose: () => void
  onSave: (values: CoacheeUpsertValues) => void
}

type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

const dayLabels = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function formatDateToInput(value: Date) {
  return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`
}

function toIsoDate(value: Date) {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

function parseDateInput(value: string): Date | null {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  const candidate = new Date(year, month - 1, day)
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
  return candidate
}

function getCalendarCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const startWeekday = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const cells: CalendarCell[] = []

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - startWeekday + 1
    let currentDate: Date
    let inCurrentMonth = true
    if (dayOffset <= 0) {
      currentDate = new Date(year, month - 1, daysInPreviousMonth + dayOffset)
      inCurrentMonth = false
    } else if (dayOffset > daysInMonth) {
      currentDate = new Date(year, month + 1, dayOffset - daysInMonth)
      inCurrentMonth = false
    } else {
      currentDate = new Date(year, month, dayOffset)
    }
    cells.push({
      isoDate: toIsoDate(currentDate),
      dayOfMonth: currentDate.getDate(),
      inCurrentMonth,
    })
  }

  return cells
}

export function CoacheeUpsertModal({ visible, mode, initialValues, onClose, onSave }: Props) {
  const CALENDAR_PANEL_WIDTH = 320
  const CALENDAR_PANEL_HEIGHT = 320
  const CALENDAR_PANEL_OFFSET = 8
  const [values, setValues] = useState<CoacheeUpsertValues>(initialValues)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())
  const [calendarAnchor, setCalendarAnchor] = useState<{ left: number; top: number } | null>(null)
  const containerRef = useRef<View | null>(null)
  const calendarButtonRef = useRef<View | null>(null)
  const firstNameInputRef = useRef<TextInput | null>(null)
  const firstSickDayInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setValues(initialValues)
    setIsCalendarOpen(false)
    setCalendarAnchor(null)
    const parsed = parseDateInput(initialValues.firstSickDay)
    setVisibleMonth(parsed ?? new Date())
  }, [initialValues, visible])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => firstNameInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  const monthTitle = useMemo(() => new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(visibleMonth), [visibleMonth])
  const calendarCells = useMemo(() => getCalendarCells(visibleMonth), [visibleMonth])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const title = mode === 'create' ? 'Cliënt toevoegen' : 'Cliënt bewerken'
  const primaryLabel = mode === 'create' ? 'Toevoegen' : 'Opslaan'
  const isSaveDisabled = values.firstName.trim().length === 0
  const selectedDate = parseDateInput(values.firstSickDay)
  const selectedIso = selectedDate ? toIsoDate(selectedDate) : ''

  function setValue<K extends keyof CoacheeUpsertValues>(key: K, nextValue: CoacheeUpsertValues[K]) {
    setValues((previous) => ({ ...previous, [key]: nextValue }))
  }

  function clampFormattedDate(formatted: string) {
    const match = formatted.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (!match) return formatted
    let day = Number(match[1])
    let month = Number(match[2])
    const year = Number(match[3])
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return formatted
    if (month > 12) month = 12
    if (month >= 1) {
      const maxDay = new Date(year, month, 0).getDate()
      if (day > maxDay) day = maxDay
    }
    return `${pad2(day)}/${pad2(month)}/${year}`
  }

  function formatDateInput(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  function updateCalendarAnchor() {
    if (!containerRef.current || !calendarButtonRef.current) return
    calendarButtonRef.current.measureLayout(
      containerRef.current as any,
      (left: number, top: number, width: number) => {
        const alignedLeft = left + width - CALENDAR_PANEL_WIDTH
        const aboveTop = top - CALENDAR_PANEL_HEIGHT - CALENDAR_PANEL_OFFSET
        setCalendarAnchor({
          left: Math.max(8, alignedLeft),
          top: Math.max(8, aboveTop),
        })
      },
      () => {
        setCalendarAnchor(null)
      },
    )
  }

  function renderInputRow(
    label: string,
    key: keyof CoacheeUpsertValues,
    options?: { placeholder?: string; inputRef?: React.RefObject<TextInput | null>; required?: boolean },
  ) {
    const value = values[key]
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {label}
          {options?.required ? ' *' : ''}
        </Text>
        <Pressable
          onPress={() => options?.inputRef?.current?.focus()}
          style={({ hovered }) => [styles.inputRow, hovered ? styles.inputRowHovered : undefined]}
        >
          <TextInput
            ref={options?.inputRef}
            value={String(value)}
            onChangeText={(text) => setValue(key, text as CoacheeUpsertValues[keyof CoacheeUpsertValues])}
            placeholder={options?.placeholder ?? ''}
            placeholderTextColor="#656565"
            style={[styles.textInput, styles.inputCursorPointer, inputWebStyle]}
          />
          <Pressable
            onPress={() => {
              if (!options?.inputRef) return
              focusAndSelectAll(options.inputRef, String(value))
            }}
            style={({ hovered }) => [styles.inputIconButton, hovered ? styles.inputIconButtonHovered : undefined]}
          >
            <EditActionIcon color="#656565" size={18} />
          </Pressable>
        </Pressable>
      </View>
    )
  }

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View ref={containerRef} style={styles.modalInner}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <MijnAccountIcon />
          </View>
          <Text isBold style={styles.headerTitle}>
            {title}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text isSemibold style={styles.sectionTitle}>
          Persoon
        </Text>
        {renderInputRow('Voornaam', 'firstName', { placeholder: 'Voornaam...', inputRef: firstNameInputRef, required: true })}
        {renderInputRow('Achternaam', 'lastName', { placeholder: 'Achternaam...' })}

        <Text isSemibold style={styles.sectionTitle}>
          Cliëntgegevens
        </Text>
        {renderInputRow('E-mail', 'clientEmail', { placeholder: 'naam@voorbeeld.nl' })}
        {renderInputRow('Telefoon', 'clientPhone', { placeholder: '0622168360' })}
        {renderInputRow('Adres', 'clientAddress', { placeholder: 'Straat + huisnummer' })}
        {renderInputRow('Postcode', 'clientPostalCode', { placeholder: '1234 AB' })}
        {renderInputRow('Woonplaats', 'clientCity', { placeholder: 'Plaats' })}

        <Text isSemibold style={styles.sectionTitle}>
          Werkgeversgegevens
        </Text>
        {renderInputRow('Werkgever', 'employerName', { placeholder: 'Organisatienaam' })}
        {renderInputRow('Contactpersoon', 'employerContactName', { placeholder: 'Naam contactpersoon' })}
        {renderInputRow('E-mail', 'employerEmail', { placeholder: 'werkgever@voorbeeld.nl' })}
        {renderInputRow('Telefoon', 'employerPhone', { placeholder: 'Telefoonnummer' })}

        <Text isSemibold style={styles.sectionTitle}>
          Verzuim
        </Text>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Eerste ziektedag</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => firstSickDayInputRef.current?.focus()}
              style={({ hovered }) => [styles.dateInputWrap, hovered ? styles.dateInputWrapHovered : undefined]}
            >
              <TextInput
                ref={firstSickDayInputRef}
                value={values.firstSickDay}
                onChangeText={(text) => {
                  const formatted = formatDateInput(text)
                  setValue('firstSickDay', clampFormattedDate(formatted))
                  setIsCalendarOpen(false)
                }}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key !== 'Backspace') return
                  if (!values.firstSickDay.endsWith('/')) return
                  setValue('firstSickDay', values.firstSickDay.slice(0, -1))
                  setIsCalendarOpen(false)
                }}
                placeholder="dd/mm/jjjj"
                placeholderTextColor="#656565"
                keyboardType="number-pad"
                style={[styles.textInput, styles.inputCursorPointer, inputWebStyle]}
              />
            </Pressable>
            <View ref={calendarButtonRef}>
              <Pressable
                onPress={() => {
                  const parsed = parseDateInput(values.firstSickDay)
                  if (parsed) setVisibleMonth(parsed)
                  updateCalendarAnchor()
                  setIsCalendarOpen((previous) => !previous)
                }}
                style={({ hovered }) => [styles.calendarButton, hovered ? styles.calendarButtonHovered : undefined]}
              >
                <CalendarCircleIcon size={18} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.footerSecondaryButton, hovered ? styles.footerSecondaryButtonHovered : undefined]}>
          <Text isBold style={styles.footerSecondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>
        <Pressable
          disabled={isSaveDisabled}
          onPress={() => onSave(values)}
          style={({ hovered }) => [styles.footerPrimaryButton, isSaveDisabled ? styles.footerPrimaryButtonDisabled : undefined, hovered && !isSaveDisabled ? styles.footerPrimaryButtonHovered : undefined]}
        >
          <Text isBold style={styles.footerPrimaryButtonText}>
            {primaryLabel}
          </Text>
        </Pressable>
      </View>
      {isCalendarOpen && calendarAnchor ? (
        <View style={[styles.calendarPanel, { left: calendarAnchor.left, top: calendarAnchor.top }]}>
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() => setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() - 1, 1))}
              style={({ hovered }) => [styles.calendarNavButton, hovered ? styles.calendarNavButtonHovered : undefined]}
            >
              <Text isBold style={styles.calendarNavButtonText}>
                {'<'}
              </Text>
            </Pressable>
            <Text isSemibold style={styles.calendarMonthTitle}>
              {monthTitle}
            </Text>
            <Pressable
              onPress={() => setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + 1, 1))}
              style={({ hovered }) => [styles.calendarNavButton, hovered ? styles.calendarNavButtonHovered : undefined]}
            >
              <Text isBold style={styles.calendarNavButtonText}>
                {'>'}
              </Text>
            </Pressable>
          </View>
          <View style={styles.calendarWeekRow}>
            {dayLabels.map((dayLabel) => (
              <View key={dayLabel} style={styles.calendarDayLabelWrap}>
                <Text isSemibold style={styles.calendarDayLabel}>
                  {dayLabel}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarCells.map((cell) => {
              const isSelected = cell.isoDate === selectedIso
              return (
                <Pressable
                  key={cell.isoDate}
                  onPress={() => {
                    const [year, month, day] = cell.isoDate.split('-').map(Number)
                    setValue('firstSickDay', formatDateToInput(new Date(year, month - 1, day)))
                    setVisibleMonth(new Date(year, month - 1, 1))
                    setIsCalendarOpen(false)
                  }}
                  style={({ hovered }) => [
                    styles.calendarDayButton,
                    !cell.inCurrentMonth ? styles.calendarDayButtonOutside : undefined,
                    isSelected ? styles.calendarDayButtonSelected : undefined,
                    hovered ? styles.calendarDayButtonHovered : undefined,
                  ]}
                >
                  <Text style={[styles.calendarDayText, !cell.inCurrentMonth ? styles.calendarDayTextOutside : undefined, isSelected ? styles.calendarDayTextSelected : undefined]}>
                    {cell.dayOfMonth}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 820,
    maxWidth: '94vw',
    maxHeight: '92vh' as any,
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'visible',
    position: 'relative',
  },
  modalInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 2,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FCE3F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  bodyScroll: {
    width: '100%',
    maxHeight: '68vh' as any,
    ...( { overflow: 'visible' } as any ),
  },
  body: {
    padding: 24,
    gap: 12,
    ...( { overflow: 'visible' } as any ),
  },
  sectionTitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  field: {
    width: '100%',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textStrong,
  },
  inputRow: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...( { cursor: 'pointer' } as any ),
  },
  inputRowHovered: {
    borderColor: colors.selected,
  },
  textInput: {
    flex: 1,
    padding: 0,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textStrong,
  },
  inputCursorPointer: {
    ...( { cursor: 'pointer' } as any ),
  },
  inputIconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputIconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInputWrap: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
    ...( { cursor: 'pointer' } as any ),
  },
  dateInputWrapHovered: {
    borderColor: colors.selected,
  },
  calendarButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    ...( { cursor: 'pointer' } as any ),
  },
  calendarButtonHovered: {
    backgroundColor: colors.hoverBackground,
    borderColor: colors.selected,
  },
  calendarPanel: {
    position: 'absolute',
    zIndex: 50,
    width: 320,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: '#FFFFFF',
    padding: 12,
    ...( { boxShadow: '0 14px 28px rgba(15,23,42,0.14)' } as any ),
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarNavButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E6C1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarNavButtonHovered: {
    backgroundColor: '#FCEFF6',
  },
  calendarNavButtonText: {
    color: colors.selected,
    fontSize: 14,
    lineHeight: 16,
  },
  calendarMonthTitle: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    textTransform: 'capitalize',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  calendarDayLabelWrap: {
    width: `${100 / 7}%` as any,
    alignItems: 'center',
  },
  calendarDayLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: '#777777',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  calendarDayButton: {
    width: 40,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayButtonOutside: {
    backgroundColor: '#FAFAFA',
  },
  calendarDayButtonSelected: {
    backgroundColor: colors.selected,
  },
  calendarDayButtonHovered: {
    backgroundColor: '#F8E4EF',
  },
  calendarDayText: {
    fontSize: 13,
    lineHeight: 16,
    color: '#1D0A00',
  },
  calendarDayTextOutside: {
    color: '#999999',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  footerSecondaryButton: {
    height: 48,
    backgroundColor: colors.surface,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 16,
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerPrimaryButton: {
    height: 48,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomRightRadius: 16,
  },
  footerPrimaryButtonDisabled: {
    backgroundColor: '#CFA5BC',
  },
  footerPrimaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  footerPrimaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
