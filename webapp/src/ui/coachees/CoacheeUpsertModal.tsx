import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { colors } from '../../design/theme/colors'
import { Text } from '../../ui/Text'
import { CalendarCircleIcon } from '../../icons/CalendarCircleIcon'
import { MijnAccountIcon } from '../../icons/MijnAccountIcon'
import { ChevronRightIcon } from '../../icons/ChevronRightIcon'
import type { CoacheeUpsertValues } from '../../types/clientProfile'

type Props = {
  visible: boolean
  mode: 'create' | 'edit'
  initialValues: CoacheeUpsertValues
  trajectoryOptions?: Array<{ id: string; label: string }>
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
  const trimmed = String(value || '').trim()
  const dutchMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (dutchMatch) {
    const day = Number(dutchMatch[1])
    const month = Number(dutchMatch[2])
    const year = Number(dutchMatch[3])
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
    const candidate = new Date(year, month - 1, day)
    if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
    return candidate
  }
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!isoMatch) return null
  const year = Number(isoMatch[1])
  const month = Number(isoMatch[2])
  const day = Number(isoMatch[3])
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

function formatInitialsFromLetters(letters: string): string {
  if (!letters) return ''
  return `${letters.toUpperCase().split('').join('.')}.`
}

function normalizeInitialsInput(raw: string, previousValue: string): string {
  const previousLetters = previousValue.replace(/[^A-Za-z]/g, '')
  const nextLettersFromRaw = raw.replace(/[^A-Za-z]/g, '')
  if (previousValue.endsWith('.') && raw === previousValue.slice(0, -1)) {
    return formatInitialsFromLetters(previousLetters.slice(0, -1))
  }
  return formatInitialsFromLetters(nextLettersFromRaw)
}

function capitalizeFirstCharacter(value: string): string {
  if (!value) return value
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function sanitizePhoneInput(raw: string): string {
  const compact = String(raw || '').replace(/\s+/g, '')
  const hasLeadingPlus = compact.startsWith('+')
  const digits = compact.replace(/\D/g, '')
  return `${hasLeadingPlus ? '+' : ''}${digits}`
}

export function CoacheeUpsertModal({ visible, mode, initialValues, trajectoryOptions = [], onClose, onSave }: Props) {
  const CALENDAR_PANEL_WIDTH = 336
  const CALENDAR_PANEL_HEIGHT = 362
  const CALENDAR_PANEL_OFFSET = 24
  const CALENDAR_PANEL_VERTICAL_NUDGE = 10
  const CALENDAR_ANIMATION_MS = 180
  const [values, setValues] = useState<CoacheeUpsertValues>(initialValues)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isCalendarMounted, setIsCalendarMounted] = useState(false)
  const [isCalendarActive, setIsCalendarActive] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())
  const [calendarAnchor, setCalendarAnchor] = useState<{ left: number; top: number } | null>(null)
  const containerRef = useRef<View | null>(null)
  const calendarButtonRef = useRef<View | null>(null)
  const calendarPanelRef = useRef<View | null>(null)
  const initialsInputRef = useRef<TextInput | null>(null)
  const firstSickDayInputRef = useRef<TextInput | null>(null)
  const inputRefs = useRef<Partial<Record<keyof CoacheeUpsertValues, TextInput | null>>>({})
  const calendarCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const monthSlideTranslateX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (!visible) return
    setValues(initialValues)
    setIsCalendarOpen(false)
    setIsCalendarMounted(false)
    setIsCalendarActive(false)
    setCalendarAnchor(null)
    const parsed = parseDateInput(initialValues.firstSickDay)
    setVisibleMonth(parsed ?? new Date())
  }, [initialValues, visible])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => initialsInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  useEffect(() => {
    if (calendarCloseTimerRef.current) {
      clearTimeout(calendarCloseTimerRef.current)
      calendarCloseTimerRef.current = null
    }

    if (isCalendarOpen) {
      setIsCalendarMounted(true)
      const id = setTimeout(() => setIsCalendarActive(true), 8)
      return () => clearTimeout(id)
    }

    setIsCalendarActive(false)
    calendarCloseTimerRef.current = setTimeout(() => {
      setIsCalendarMounted(false)
      calendarCloseTimerRef.current = null
    }, CALENDAR_ANIMATION_MS)

    return () => {
      if (calendarCloseTimerRef.current) {
        clearTimeout(calendarCloseTimerRef.current)
        calendarCloseTimerRef.current = null
      }
    }
  }, [CALENDAR_ANIMATION_MS, isCalendarOpen])

  useEffect(() => {
    if (!isCalendarOpen) return
    if (typeof window === 'undefined') return

    const pointInRect = (x: number, y: number, rect: DOMRect | null | undefined) => {
      if (!rect) return false
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    }

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const touch = 'touches' in event ? event.touches[0] ?? event.changedTouches[0] : null
      const clientX = touch ? touch.clientX : (event as MouseEvent).clientX
      const clientY = touch ? touch.clientY : (event as MouseEvent).clientY
      if (typeof clientX !== 'number' || typeof clientY !== 'number') return

      const panelRect = (calendarPanelRef.current as any)?.getBoundingClientRect?.() as DOMRect | undefined
      const buttonRect = (calendarButtonRef.current as any)?.getBoundingClientRect?.() as DOMRect | undefined
      if (pointInRect(clientX, clientY, panelRect) || pointInRect(clientX, clientY, buttonRect)) return

      setIsCalendarOpen(false)
    }

    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('touchstart', onPointerDown, { passive: true })

    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('touchstart', onPointerDown)
    }
  }, [isCalendarOpen])

  const monthTitle = useMemo(() => new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(visibleMonth), [visibleMonth])
  const calendarCells = useMemo(() => getCalendarCells(visibleMonth), [visibleMonth])

  const hasSelectableTrajectory = trajectoryOptions.length > 0

  useEffect(() => {
    if (!visible) return
    if (!hasSelectableTrajectory) return
    if (values.trajectoryId) return
    setValues((previous) => ({ ...previous, trajectoryId: trajectoryOptions[0]?.id ?? previous.trajectoryId }))
  }, [hasSelectableTrajectory, trajectoryOptions, values.trajectoryId, visible])

  if (!visible) return null

  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const title = mode === 'create' ? 'Cliënt toevoegen' : 'Cliënt bewerken'
  const primaryLabel = mode === 'create' ? 'Toevoegen' : 'Opslaan'
  const trimmedBsn = values.bsn.trim()
  const isBsnValid = trimmedBsn.length === 0 || /^\d{8,9}$/.test(trimmedBsn)
  const hasStartDateInput = values.firstSickDay.trim().length > 0
  const isStartDateValid = hasStartDateInput ? Boolean(parseDateInput(values.firstSickDay)) : true
  const isSaveDisabled =
    values.firstName.trim().length === 0 ||
    values.lastName.trim().length === 0 ||
    !isBsnValid ||
    !isStartDateValid
  const selectedDate = parseDateInput(values.firstSickDay)
  const selectedIso = selectedDate ? toIsoDate(selectedDate) : ''
  const selectedTrajectoryLabel = 'Werkfit maken'

  function setValue<K extends keyof CoacheeUpsertValues>(key: K, nextValue: CoacheeUpsertValues[K]) {
    setValues((previous) => ({ ...previous, [key]: nextValue }))
  }

  function clampDateDigits(digits: string) {
    if (digits.length === 0) return digits
    const fallbackYear = new Date().getFullYear()
    const rawDay = digits.slice(0, Math.min(2, digits.length))
    const rawMonth = digits.length > 2 ? digits.slice(2, Math.min(4, digits.length)) : ''
    const rawYear = digits.length > 4 ? digits.slice(4) : ''

    let day = rawDay
    if (rawDay.length === 2) {
      const dayNumber = Number(rawDay)
      if (Number.isFinite(dayNumber)) {
        let maxDay = 31
        if (rawMonth.length === 2) {
          const monthNumber = Number(rawMonth)
          if (monthNumber >= 1 && monthNumber <= 12) {
            const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
            maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
          }
        }
        day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
      }
    }

    let month = rawMonth
    if (rawMonth.length === 2) {
      const monthNumber = Number(rawMonth)
      if (Number.isFinite(monthNumber)) {
        month = pad2(Math.max(1, Math.min(monthNumber, 12)))
      }
    }

    if (day.length === 2 && month.length === 2) {
      const dayNumber = Number(day)
      const monthNumber = Number(month)
      if (Number.isFinite(dayNumber) && Number.isFinite(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        const yearForCalc = rawYear.length === 4 ? Number(rawYear) : fallbackYear
        const maxDay = new Date(yearForCalc, monthNumber, 0).getDate()
        day = pad2(Math.max(1, Math.min(dayNumber, maxDay)))
      }
    }

    return `${day}${month}${rawYear}`.slice(0, 8)
  }

  function formatDateInput(raw: string, previousValue: string) {
    const previousDigits = previousValue.replace(/\D/g, '').slice(0, 8)
    const rawDigits = raw.replace(/\D/g, '').slice(0, 8)
    const digits = clampDateDigits(rawDigits)
    const isDeleting = rawDigits.length < previousDigits.length
    const endsAtSecondSeparator = previousValue.endsWith('/') && rawDigits.length === previousDigits.length

    if (isDeleting && endsAtSecondSeparator) {
      const digitsWithoutMonth = digits.slice(0, 2)
      return digitsWithoutMonth.length === 2 ? `${digitsWithoutMonth}/` : digitsWithoutMonth
    }

    if (isDeleting && previousValue.endsWith('/') && previousDigits.length === 2 && rawDigits.length === 2) {
      return digits
    }

    if (digits.length <= 2) return digits.length === 2 ? `${digits}/` : digits
    if (digits.length <= 4) {
      const monthPart = digits.slice(2)
      return digits.length === 4 ? `${digits.slice(0, 2)}/${monthPart}/` : `${digits.slice(0, 2)}/${monthPart}`
    }
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  }

  function updateCalendarAnchor() {
    if (!containerRef.current || !calendarButtonRef.current) return
    calendarButtonRef.current.measureLayout(
      containerRef.current as any,
      (left: number, top: number, width: number) => {
        const alignedLeft = left + width - CALENDAR_PANEL_WIDTH
        const aboveTop = top - CALENDAR_PANEL_HEIGHT - CALENDAR_PANEL_OFFSET - CALENDAR_PANEL_VERTICAL_NUDGE
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
    options?: { placeholder?: string; inputRef?: React.MutableRefObject<TextInput | null>; required?: boolean },
  ) {
    const value = values[key]
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>
          {label}
          {options?.required ? ' *' : ''}
        </Text>
        <Pressable onPress={() => inputRefs.current[key]?.focus()} style={({ hovered }) => [styles.inputRow, hovered ? styles.inputRowHovered : undefined]}>
          <TextInput
            ref={(instance) => {
              inputRefs.current[key] = instance
              if (options?.inputRef) options.inputRef.current = instance
            }}
            value={String(value)}
            onChangeText={(text) => {
              if (key === 'initials') {
                setValue('initials', normalizeInitialsInput(text, values.initials))
                return
              }
              if (key === 'bsn') {
                setValue('bsn', text.replace(/\D/g, ''))
                return
              }
              if (key === 'lastName') {
                setValue('lastName', capitalizeFirstCharacter(text))
                return
              }
              if (key === 'clientPhone') {
                setValue('clientPhone', sanitizePhoneInput(text))
                return
              }
              setValue(key, text as CoacheeUpsertValues[keyof CoacheeUpsertValues])
            }}
            placeholder={options?.placeholder ?? ''}
            placeholderTextColor="#656565"
            style={[styles.textInput, styles.inputCursorPointer, inputWebStyle]}
          />
        </Pressable>
      </View>
    )
  }

  function renderTrajectoryDisplay() {
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Traject</Text>
        <View style={[styles.inputRow, styles.inputRowReadOnly]}>
          <Text style={styles.dropdownValueText}>{selectedTrajectoryLabel || 'Werkfit maken'}</Text>
        </View>
      </View>
    )
  }

  function shiftVisibleMonth(delta: -1 | 1) {
    monthSlideTranslateX.setValue(delta * 18)
    setVisibleMonth((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1))
    Animated.timing(monthSlideTranslateX, {
      toValue: 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
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
        {renderInputRow('Voornaam', 'firstName', { placeholder: 'Voornaam', required: true })}
        {renderInputRow('Voorletters', 'initials', { placeholder: 'Bijv. J.A.', inputRef: initialsInputRef, required: true })}
        {renderInputRow('Achternaam', 'lastName', { placeholder: 'Achternaam', required: true })}
        {renderInputRow('Burgerservicenummer', 'bsn', { placeholder: 'BSN' })}
        {renderInputRow('E-mail', 'clientEmail', { placeholder: 'naam@voorbeeld.nl' })}
        {renderInputRow('Telefoon', 'clientPhone', { placeholder: '+31612345678' })}
        {renderTrajectoryDisplay()}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Startdatum</Text>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => firstSickDayInputRef.current?.focus()}
              style={({ hovered }) => [
                styles.dateInputWrap,
                !isStartDateValid ? styles.dateInputWrapInvalid : undefined,
                hovered ? styles.dateInputWrapHovered : undefined,
              ]}
            >
              <TextInput
                ref={(instance) => {
                  firstSickDayInputRef.current = instance
                  inputRefs.current.firstSickDay = instance
                }}
                value={values.firstSickDay}
                onChangeText={(text) => {
                  setValue('firstSickDay', formatDateInput(text, values.firstSickDay))
                }}
                placeholder="DD/MM/JJJJ"
                placeholderTextColor="#656565"
                style={[styles.textInput, styles.inputCursorPointer, inputWebStyle]}
              />
            </Pressable>
            <Pressable
              ref={calendarButtonRef as any}
              onPress={() => {
                updateCalendarAnchor()
                setIsCalendarOpen((previous) => !previous)
              }}
              style={({ hovered }) => [styles.calendarButton, hovered ? styles.calendarButtonHovered : undefined]}
            >
              <CalendarCircleIcon size={20} />
            </Pressable>
          </View>
        </View>
        {renderInputRow('Ordernummer', 'orderNumber', { placeholder: 'Ordernummer' })}
        {renderInputRow('Naam contactpersoon UWV', 'uwvContactName', { placeholder: 'Naam contactpersoon UWV' })}
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
      {isCalendarMounted && calendarAnchor ? (
        <View ref={calendarPanelRef} style={[styles.calendarPanel, styles.calendarPanelTransitionBase, isCalendarActive ? styles.calendarPanelTransitionOpen : styles.calendarPanelTransitionClosed, { left: calendarAnchor.left, top: calendarAnchor.top }]}>
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() => shiftVisibleMonth(-1)}
              style={({ hovered }) => [styles.calendarNavButton, hovered ? styles.calendarNavButtonHovered : undefined]}
            >
              <View style={styles.rotatedChevron}>
                <ChevronRightIcon color={colors.textStrong} size={18} />
              </View>
            </Pressable>
            <Text isSemibold style={styles.calendarMonthTitle}>
              {monthTitle}
            </Text>
            <Pressable
              onPress={() => shiftVisibleMonth(1)}
              style={({ hovered }) => [styles.calendarNavButton, hovered ? styles.calendarNavButtonHovered : undefined]}
            >
              <ChevronRightIcon color={colors.textStrong} size={18} />
            </Pressable>
          </View>
          <Animated.View style={{ transform: [{ translateX: monthSlideTranslateX }] }}>
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
          </Animated.View>
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
    overflow: 'visible',
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
  inputRowDisabled: {
    opacity: 0.6,
  },
  inputRowReadOnly: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D5D7DA',
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
  dropdownValueText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textStrong,
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
  dateInputWrapInvalid: {
    borderColor: '#D92D20',
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
    width: 336,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    backgroundColor: '#FFFFFF',
    padding: 12,
    ...( { boxShadow: '0 14px 28px rgba(15,23,42,0.14)' } as any ),
  },
  calendarPanelTransitionBase: {
    ...( { transitionProperty: 'opacity, transform', transitionDuration: '180ms', transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)', transformOrigin: '100% 100%', willChange: 'opacity, transform' } as any ),
  },
  calendarPanelTransitionOpen: {
    opacity: 1,
    ...( { transform: 'translateY(0px) scale(1)' } as any ),
  },
  calendarPanelTransitionClosed: {
    opacity: 0,
    ...( { transform: 'translateY(8px) scale(0.96)' } as any ),
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
  rotatedChevron: {
    transform: [{ rotate: '180deg' }],
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
    rowGap: 4,
  },
  calendarDayButton: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    borderRadius: 6,
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




