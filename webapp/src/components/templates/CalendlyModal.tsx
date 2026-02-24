import React, { useMemo, useState } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'

import { colors } from '../../theme/colors'
import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { Text } from '../Text'
import { ChevronLeftIcon } from '../icons/ChevronLeftIcon'
import { ChevronRightIcon } from '../icons/ChevronRightIcon'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  onClose: () => void
  calendlyUrl: string
}

type TimezoneOption = {
  key: string
  label: string
}

const weekdayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const timezoneOptions: TimezoneOption[] = [
  { key: 'cet', label: 'Central European Time' },
  { key: 'cest', label: 'Central European Summer Time' },
  { key: 'utc', label: 'UTC' },
]

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthGridDates(monthDate: Date) {
  const first = startOfMonth(monthDate)
  const firstWeekday = (first.getDay() + 6) % 7
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - firstWeekday)
  const dates: Date[] = []
  for (let i = 0; i < 42; i += 1) {
    dates.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i))
  }
  return dates
}

function getTimeSlotsForDate(date: Date): string[] {
  const weekday = date.getDay()
  if (weekday === 0 || weekday === 6) return []
  if (weekday === 1 || weekday === 3) return ['09:00', '10:30', '13:30', '15:00']
  if (weekday === 2) return ['08:30', '11:00', '14:00', '16:30']
  if (weekday === 4) return ['09:30', '12:00', '14:30']
  return ['09:00', '11:30', '13:00', '15:30']
}

export function CalendlyModal({ visible, onClose, calendlyUrl }: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 1080
  const today = useMemo(() => startOfDay(new Date()), [])
  const [displayedMonth, setDisplayedMonth] = useState<Date>(() => startOfMonth(today))
  const [selectedDate, setSelectedDate] = useState<Date | null>(today)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [selectedTimezone, setSelectedTimezone] = useState<TimezoneOption>(timezoneOptions[0])

  const dates = useMemo(() => monthGridDates(displayedMonth), [displayedMonth])
  const monthLabel = useMemo(
    () => displayedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    [displayedMonth],
  )
  const selectedDateLabel = useMemo(
    () => (selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'),
    [selectedDate],
  )
  const availableTimes = useMemo(() => (selectedDate ? getTimeSlotsForDate(selectedDate) : []), [selectedDate])

  function openCalendly() {
    if (typeof window === 'undefined') return
    window.open(calendlyUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.ribbonWrap} pointerEvents="none">
        <View style={styles.ribbon}>
          <Text isBold style={styles.ribbonText}>
            POWERED BY CALENDLY
          </Text>
        </View>
      </View>

      <View style={styles.header}>
        <Text isBold style={styles.title}>
          Plan een meeting in
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      <View style={[styles.body, isCompact ? styles.bodyCompact : undefined]}>
        <View style={[styles.calendarPane, isCompact ? styles.calendarPaneCompact : undefined]}>
          <View style={styles.monthNavRow}>
            <Pressable onPress={() => setDisplayedMonth((previous) => addMonths(previous, -1))} style={({ hovered }) => [styles.navButton, hovered ? styles.navButtonHovered : undefined]}>
              <ChevronLeftIcon color="#6D6D6D" size={22} />
            </Pressable>
            <Text isSemibold style={styles.monthLabel}>
              {monthLabel}
            </Text>
            <Pressable onPress={() => setDisplayedMonth((previous) => addMonths(previous, 1))} style={({ hovered }) => [styles.navButton, styles.navButtonAccent, hovered ? styles.navButtonAccentHovered : undefined]}>
              <ChevronRightIcon color="#FFFFFF" size={20} />
            </Pressable>
          </View>

          <View style={styles.weekHeaderRow}>
            {weekdayLabels.map((label) => (
              <Text key={label} isSemibold style={styles.weekHeaderText}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {dates.map((date) => {
              const isCurrentMonth = date.getMonth() === displayedMonth.getMonth()
              const isPast = date.getTime() < today.getTime()
              const disabled = !isCurrentMonth || isPast
              const isSelected = selectedDate ? sameDay(date, selectedDate) : false
              return (
                <Pressable
                  key={toDateKey(date)}
                  disabled={disabled}
                  onPress={() => {
                    setSelectedDate(date)
                    setSelectedTime(null)
                  }}
                  style={({ hovered }) => [
                    styles.dayCell,
                    isSelected ? styles.dayCellSelected : undefined,
                    !isSelected && hovered && !disabled ? styles.dayCellHovered : undefined,
                    disabled ? styles.dayCellDisabled : undefined,
                  ]}
                >
                  <Text style={[styles.dayCellText, disabled ? styles.dayCellTextDisabled : undefined, isSelected ? styles.dayCellTextSelected : undefined]}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <View style={styles.timezoneSection}>
            <Text isSemibold style={styles.timezoneTitle}>
              Time zone
            </Text>
            <View style={styles.timezoneRow}>
              {timezoneOptions.map((option) => {
                const active = option.key === selectedTimezone.key
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => setSelectedTimezone(option)}
                    style={({ hovered }) => [
                      styles.timezoneChip,
                      active ? styles.timezoneChipActive : undefined,
                      hovered && !active ? styles.timezoneChipHovered : undefined,
                    ]}
                  >
                    <Text style={[styles.timezoneChipText, active ? styles.timezoneChipTextActive : undefined]}>{option.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        <View style={[styles.timePane, isCompact ? styles.timePaneCompact : undefined]}>
          <Text isSemibold style={styles.sideTitle}>
            {selectedDateLabel}
          </Text>
          <Text style={styles.sideCaption}>Beschikbare momenten</Text>
          <View style={styles.timesGrid}>
            {availableTimes.length === 0 ? (
              <Text style={styles.noTimesText}>Geen beschikbare tijden op deze dag.</Text>
            ) : (
              availableTimes.map((slot) => {
                const active = slot === selectedTime
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedTime(slot)}
                    style={({ hovered }) => [
                      styles.timeButton,
                      active ? styles.timeButtonActive : undefined,
                      hovered && !active ? styles.timeButtonHovered : undefined,
                    ]}
                  >
                    <Text isSemibold={active} style={[styles.timeButtonText, active ? styles.timeButtonTextActive : undefined]}>
                      {slot}
                    </Text>
                  </Pressable>
                )
              })
            )}
          </View>
          <Pressable
            disabled={!selectedDate || !selectedTime}
            onPress={openCalendly}
            style={({ hovered }) => [
              styles.primaryButton,
              !selectedDate || !selectedTime ? styles.primaryButtonDisabled : undefined,
              hovered && selectedDate && selectedTime ? styles.primaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.primaryButtonText}>
              Ga verder in Calendly
            </Text>
          </Pressable>
        </View>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 1080,
    maxWidth: '94vw',
    ...( { height: 'min(820px, 94vh)' } as any ),
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  ribbonWrap: {
    position: 'absolute',
    top: 18,
    right: -28,
    zIndex: 4,
    ...( { transform: [{ rotate: '45deg' }] } as any ),
  },
  ribbon: {
    backgroundColor: '#4A545E',
    paddingHorizontal: 34,
    paddingVertical: 6,
  },
  ribbonText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  header: {
    height: 84,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  bodyCompact: {
    flexDirection: 'column',
  },
  calendarPane: {
    flex: 1.25,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
  },
  calendarPaneCompact: {
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  navButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F3F7',
  },
  navButtonHovered: {
    backgroundColor: '#E8EBF2',
  },
  navButtonAccent: {
    backgroundColor: colors.selected,
  },
  navButtonAccentHovered: {
    backgroundColor: '#A50058',
  },
  monthLabel: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textStrong,
  },
  weekHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekHeaderText: {
    width: '14.2%',
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  dayCell: {
    width: '14.2%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  dayCellHovered: {
    backgroundColor: '#F4F1F3',
  },
  dayCellSelected: {
    backgroundColor: '#FBE7F3',
  },
  dayCellDisabled: {
    ...( { pointerEvents: 'none' } as any ),
  },
  dayCellText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  dayCellTextDisabled: {
    color: '#C0C6CF',
  },
  dayCellTextSelected: {
    color: '#A60059',
  },
  timezoneSection: {
    marginTop: 16,
    gap: 10,
  },
  timezoneTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textStrong,
  },
  timezoneRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  timezoneChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFFFFF',
  },
  timezoneChipActive: {
    borderColor: colors.selected,
    backgroundColor: '#FBE7F3',
  },
  timezoneChipHovered: {
    backgroundColor: colors.hoverBackground,
  },
  timezoneChipText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  timezoneChipTextActive: {
    color: '#A60059',
  },
  timePane: {
    flex: 0.9,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 20,
    gap: 10,
  },
  timePaneCompact: {
    minHeight: 280,
  },
  sideTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.textStrong,
  },
  sideCaption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignContent: 'flex-start',
    minHeight: 96,
  },
  noTimesText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  timeButton: {
    minWidth: 92,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timeButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  timeButtonActive: {
    borderColor: colors.selected,
    backgroundColor: '#FBE7F3',
  },
  timeButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#3B4552',
  },
  timeButtonTextActive: {
    color: '#A60059',
  },
  primaryButton: {
    marginTop: 'auto',
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5B8D0',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
