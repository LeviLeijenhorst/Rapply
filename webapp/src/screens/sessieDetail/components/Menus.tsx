import React from 'react'
import { Animated, Pressable, ScrollView, TextInput, View } from 'react-native'

import { AnimatedDropdownPanel } from '../../../ui/AnimatedDropdownPanel'
import { WebPortal } from '../../../ui/WebPortal'
import { ChevronRightIcon } from '../../../icons/ChevronRightIcon'
import { Text } from '../../../ui/Text'
import { colors } from '../../../design/theme/colors'
import { styles } from '../styles'

type CalendarCell = {
  isoDate: string
  dayOfMonth: number
  inCurrentMonth: boolean
}

type Props = {
  activeCoacheeNames: string[]
  dateCalendarCells: CalendarCell[]
  dateCalendarPanelRef: React.RefObject<any>
  dateMenuPosition: { left: number; top: number; width: number } | null
  dateMonthSlideTranslateX: Animated.Value
  dateMonthTitle: string
  dayLabels: string[]
  editableSessionTitle: string
  inputWebStyle: any
  isCoacheeMenuVisible: boolean
  isDateCalendarOpen: boolean
  isTitleEditorOpen: boolean
  onAddNewCoachee: () => void
  onCancelTitleEditing: () => void
  onChangeSessionTitle: (value: string) => void
  onSelectCalendarIsoDate: (isoDate: string) => void
  onSelectCoacheeName: (name: string) => void
  onShiftVisibleDateMonth: (delta: -1 | 1) => void
  onSubmitTitleEditing: () => void
  selectedDateIso: string
  sessionTitleInputRef: React.RefObject<TextInput | null>
  titleEditorPanelRef: React.RefObject<any>
  titleMenuPosition: { left: number; top: number; width: number } | null
  coacheeMenuPosition: { left: number; top: number; width: number } | null
}

export function Menus({
  activeCoacheeNames,
  dateCalendarCells,
  dateCalendarPanelRef,
  dateMenuPosition,
  dateMonthSlideTranslateX,
  dateMonthTitle,
  dayLabels,
  editableSessionTitle,
  inputWebStyle,
  isCoacheeMenuVisible,
  isDateCalendarOpen,
  isTitleEditorOpen,
  onAddNewCoachee,
  onCancelTitleEditing,
  onChangeSessionTitle,
  onSelectCalendarIsoDate,
  onSelectCoacheeName,
  onShiftVisibleDateMonth,
  onSubmitTitleEditing,
  selectedDateIso,
  sessionTitleInputRef,
  titleEditorPanelRef,
  titleMenuPosition,
  coacheeMenuPosition,
}: Props) {
  return (
    <>
      {isCoacheeMenuVisible && coacheeMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isCoacheeMenuVisible}
            style={[styles.coacheeMenu, { left: coacheeMenuPosition.left, top: coacheeMenuPosition.top, width: coacheeMenuPosition.width } as any]}
          >
            <ScrollView
              style={styles.coacheeMenuScroll}
              contentContainerStyle={styles.coacheeMenuScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {activeCoacheeNames.map((name, index) => {
                const isFirst = index === 0
                return (
                  <Pressable
                    key={name}
                    onPress={() => onSelectCoacheeName(name)}
                    style={({ hovered }) => [
                      styles.coacheeMenuRow,
                      isFirst ? styles.coacheeMenuRowTop : undefined,
                      hovered ? styles.coacheeMenuRowHovered : undefined,
                    ]}
                  >
                    <Text isSemibold style={styles.coacheeMenuRowText}>
                      {name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onAddNewCoachee()
              }}
              style={({ hovered }) => [
                styles.coacheeMenuRow,
                styles.coacheeMenuRowAdd,
                activeCoacheeNames.length === 0 ? styles.coacheeMenuRowTop : undefined,
                styles.coacheeMenuRowBottom,
                hovered ? styles.coacheeMenuRowAddHovered : undefined,
              ]}
            >
              <Text isSemibold style={styles.coacheeMenuRowAddText}>
                + Nieuwe cliënt
              </Text>
            </Pressable>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}

      {isTitleEditorOpen && titleMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isTitleEditorOpen}
            style={[styles.titleEditorMenu, { left: titleMenuPosition.left, top: titleMenuPosition.top, width: titleMenuPosition.width } as any]}
          >
            <View ref={titleEditorPanelRef} style={styles.titleEditorPanelInner}>
              <TextInput
                ref={sessionTitleInputRef}
                value={editableSessionTitle}
                onChangeText={onChangeSessionTitle}
                onBlur={onSubmitTitleEditing}
                onKeyPress={(event) => {
                  if (event.nativeEvent.key === 'Enter') {
                    onSubmitTitleEditing()
                  }
                  if (event.nativeEvent.key === 'Escape') {
                    onCancelTitleEditing()
                  }
                }}
                placeholder="Verslagtitel"
                placeholderTextColor={colors.textSecondary}
                style={[styles.titleEditorInput, inputWebStyle]}
              />
            </View>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}

      {isDateCalendarOpen && dateMenuPosition ? (
        <WebPortal>
          <AnimatedDropdownPanel
            visible={isDateCalendarOpen}
            style={[styles.dateCalendarMenu, { left: dateMenuPosition.left, top: dateMenuPosition.top, width: dateMenuPosition.width } as any]}
          >
            <View ref={dateCalendarPanelRef} style={styles.dateCalendarPanelInner}>
              <View style={styles.dateCalendarHeader}>
                <Pressable
                  onPress={() => onShiftVisibleDateMonth(-1)}
                  style={({ hovered }) => [styles.dateCalendarNavButton, hovered ? styles.dateCalendarNavButtonHovered : undefined]}
                >
                  <View style={styles.rotatedChevron}>
                    <ChevronRightIcon color={colors.textStrong} size={18} />
                  </View>
                </Pressable>
                <Text isSemibold style={styles.dateCalendarMonthTitle}>
                  {dateMonthTitle}
                </Text>
                <Pressable
                  onPress={() => onShiftVisibleDateMonth(1)}
                  style={({ hovered }) => [styles.dateCalendarNavButton, hovered ? styles.dateCalendarNavButtonHovered : undefined]}
                >
                  <ChevronRightIcon color={colors.textStrong} size={18} />
                </Pressable>
              </View>
              <Animated.View style={{ transform: [{ translateX: dateMonthSlideTranslateX }] }}>
                <View style={styles.dateCalendarWeekRow}>
                  {dayLabels.map((dayLabel) => (
                    <View key={dayLabel} style={styles.dateCalendarDayLabelWrap}>
                      <Text isSemibold style={styles.dateCalendarDayLabel}>
                        {dayLabel}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.dateCalendarGrid}>
                  {dateCalendarCells.map((cell) => {
                    const isSelected = cell.isoDate === selectedDateIso
                    return (
                      <Pressable
                        key={cell.isoDate}
                        onPress={() => onSelectCalendarIsoDate(cell.isoDate)}
                        style={({ hovered }) => [
                          styles.dateCalendarDayButton,
                          !cell.inCurrentMonth ? styles.dateCalendarDayButtonOutside : undefined,
                          isSelected ? styles.dateCalendarDayButtonSelected : undefined,
                          hovered ? styles.dateCalendarDayButtonHovered : undefined,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateCalendarDayText,
                            !cell.inCurrentMonth ? styles.dateCalendarDayTextOutside : undefined,
                            isSelected ? styles.dateCalendarDayTextSelected : undefined,
                          ]}
                        >
                          {cell.dayOfMonth}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              </Animated.View>
            </View>
          </AnimatedDropdownPanel>
        </WebPortal>
      ) : null}
    </>
  )
}

