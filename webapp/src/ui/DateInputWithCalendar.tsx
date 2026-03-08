import React, { useEffect, useMemo, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../ui/AnimatedOverlayModal'
import { CalendarCircleIcon } from '../icons/CalendarCircleIcon'
import { ChevronRightIcon } from '../icons/ChevronRightIcon'
import { Text } from '../ui/Text'
import { colors } from '../design/theme/colors'
import { typography } from '../design/theme/typography'

type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

type Props = {
  value: string
  onChangeValue: (value: string) => void
  placeholder?: string
}

const dayLabels = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo']

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`
}

function formatDateToInput(value: Date): string {
  return `${pad2(value.getDate())}/${pad2(value.getMonth() + 1)}/${value.getFullYear()}`
}

function parseDateInput(value: string): Date | null {
  const ddMmYyyy = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (ddMmYyyy) {
    const day = Number(ddMmYyyy[1])
    const month = Number(ddMmYyyy[2])
    const year = Number(ddMmYyyy[3])
    const candidate = new Date(year, month - 1, day)
    if (candidate.getFullYear() === year && candidate.getMonth() === month - 1 && candidate.getDate() === day) return candidate
  }
  const iso = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!iso) return null
  const year = Number(iso[1])
  const month = Number(iso[2])
  const day = Number(iso[3])
  const candidate = new Date(year, month - 1, day)
  if (candidate.getFullYear() !== year || candidate.getMonth() !== month - 1 || candidate.getDate() !== day) return null
  return candidate
}

function clampDateDigits(digits: string, fallbackYear: number): string {
  if (digits.length === 0) return digits
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

function formatTypingDateInput(raw: string, previousValue: string): string {
  const fallbackYear = new Date().getFullYear()
  const rawDigits = raw.replace(/\D/g, '').slice(0, 8)
  const digits = clampDateDigits(rawDigits, fallbackYear)
  void previousValue
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
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
    cells.push({ isoDate: toIsoDate(currentDate), dayOfMonth: currentDate.getDate(), inCurrentMonth })
  }

  return cells
}

export function DateInputWithCalendar({ value, onChangeValue, placeholder = 'Startdatum (DD/MM/JJJJ)' }: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())
  const [monthSlideTranslateX] = useState(() => new Animated.Value(0))

  const parsed = useMemo(() => parseDateInput(value), [value])
  const selectedIso = parsed ? toIsoDate(parsed) : ''
  const monthTitle = useMemo(() => new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(visibleMonth), [visibleMonth])
  const calendarCells = useMemo(() => getCalendarCells(visibleMonth), [visibleMonth])

  useEffect(() => {
    if (!isCalendarOpen) return
    setVisibleMonth(parsed ?? new Date())
  }, [isCalendarOpen, parsed])

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
    <>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={(nextValue) => onChangeValue(formatTypingDateInput(nextValue, value))}
          placeholder={placeholder}
          placeholderTextColor="#818181"
          style={[styles.input, inputWebStyle]}
        />
        <Pressable
          onPress={() => setIsCalendarOpen(true)}
          style={({ hovered }) => [styles.calendarButton, hovered ? styles.calendarButtonHovered : undefined]}
        >
          <CalendarCircleIcon size={20} />
        </Pressable>
      </View>

      <AnimatedOverlayModal
        visible={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        contentContainerStyle={styles.calendarModal}
      >
        <View style={styles.calendarHeader}>
          <Pressable
            onPress={() => shiftVisibleMonth(-1)}
            style={({ hovered }) => [styles.calendarNavButton, hovered ? styles.calendarNavButtonHovered : undefined]}
          >
            <View style={styles.rotatedChevron}>
              <ChevronRightIcon color={colors.textStrong} size={18} />
            </View>
          </Pressable>
          <Text isSemibold style={styles.calendarMonthTitle}>{monthTitle}</Text>
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
                <Text isSemibold style={styles.calendarDayLabel}>{dayLabel}</Text>
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
                    onChangeValue(formatDateToInput(new Date(year, month - 1, day)))
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
      </AnimatedOverlayModal>
    </>
  )
}

const styles = StyleSheet.create({
  inputRow: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    lineHeight: 20,
    fontFamily: typography.fontFamilyRegular,
    color: colors.textStrong,
    padding: 0,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  calendarButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  calendarModal: {
    width: 336,
    maxWidth: 336,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E3E3',
    padding: 12,
    gap: 8,
    ...( { boxShadow: '0 14px 28px rgba(15,23,42,0.14)' } as any ),
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  rotatedChevron: {
    transform: [{ rotate: '180deg' }],
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
})

