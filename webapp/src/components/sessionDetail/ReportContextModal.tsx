import React, { useEffect, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { CalendarCircleIcon } from '../../icons/CalendarCircleIcon'

type Props = {
  visible: boolean
  initialValues: { wvpWeekNumber: string; reportFirstSickDay: string }
  onClose: () => void
  onSave: (values: { wvpWeekNumber: string; reportFirstSickDay: string }) => void
}

export function ReportContextModal({ visible, initialValues, onClose, onSave }: Props) {
  const [wvpWeekNumber, setWvpWeekNumber] = useState(initialValues.wvpWeekNumber)
  const [reportFirstSickDay, setReportFirstSickDay] = useState(initialValues.reportFirstSickDay)
  const firstInputRef = useRef<TextInput | null>(null)

  useEffect(() => {
    if (!visible) return
    setWvpWeekNumber(initialValues.wvpWeekNumber)
    setReportFirstSickDay(initialValues.reportFirstSickDay)
  }, [initialValues, visible])

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(() => firstInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [visible])

  if (!visible) return null
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconCircle}>
            <CalendarCircleIcon size={18} />
          </View>
          <Text isBold style={styles.headerTitle}>
            Aanvullende verslaggegevens
          </Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Weeknummer (WvP)</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={firstInputRef}
              value={wvpWeekNumber}
              onChangeText={setWvpWeekNumber}
              placeholder="Bijv. week 8"
              placeholderTextColor="#656565"
              style={[styles.textInput, inputWebStyle]}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Eerste ziektedag (voor dit verslag)</Text>
          <View style={styles.inputRow}>
            <TextInput
              value={reportFirstSickDay}
              onChangeText={setReportFirstSickDay}
              placeholder="Bijv. 03-01-2026"
              placeholderTextColor="#656565"
              style={[styles.textInput, inputWebStyle]}
            />
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
          <Text isBold style={styles.secondaryButtonText}>
            Overslaan
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSave({ wvpWeekNumber, reportFirstSickDay })}
          style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
        >
          <Text isBold style={styles.primaryButtonText}>
            Opslaan
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 680,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as any ),
    overflow: 'hidden',
  },
  header: {
    width: '100%',
    height: 72,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
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
  body: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
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
    justifyContent: 'center',
  },
  textInput: {
    width: '100%',
    padding: 0,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textStrong,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    height: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  primaryButton: {
    height: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    backgroundColor: colors.selected,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})

