import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedDropdownPanel } from '../../ui/AnimatedDropdownPanel'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { ChevronLeftIcon } from '../../icons/ChevronLeftIcon'
import { ChevronDownIcon } from '../../icons/ChevronDownIcon'
import { ProfileCircleIcon } from '../../icons/ProfileCircleIcon'
import { useLocalAppData } from '../../storage/LocalAppDataProvider'
import { getCoacheeDisplayName, unassignedCoacheeLabel } from '../../types/client'
import { buildUntitledSessionTitle } from '../../utils/text/buildUntitledTitle'

type Props = {
  initialCoacheeId?: string | null
  onBack: () => void
  onOpenSession: (sessionId: string) => void
  onOpenNewCoachee: () => void
}

export function ReportScreen({ initialCoacheeId = null, onBack, onOpenSession, onOpenNewCoachee }: Props) {
  const { data, createSession, setWrittenReport } = useLocalAppData()
  const [isCoacheeOpen, setIsCoacheeOpen] = useState(false)
  const activeCoachees = useMemo(() => data.coachees.filter((coachee) => !coachee.isArchived), [data.coachees])
  const [selectedCoacheeId, setSelectedCoacheeId] = useState<string | null>(null)
  const [reportText, setReportText] = useState('')
  const reportInputRef = useRef<TextInput | null>(null)
  const [reportTitle, setReportTitle] = useState('')

  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])

  const isAnyDropdownOpen = isCoacheeOpen
  const selectedCoacheeName = useMemo(() => getCoacheeDisplayName(activeCoachees, selectedCoacheeId), [activeCoachees, selectedCoacheeId])
  const coacheeOptions = useMemo(() => [{ id: null, name: unassignedCoacheeLabel }, ...activeCoachees], [activeCoachees])
  const defaultTitle = useMemo(() => buildUntitledSessionTitle('verslag'), [])

  useEffect(() => {
    if (reportTitle) return
    setReportTitle(defaultTitle)
  }, [defaultTitle, reportTitle])

  useEffect(() => {
    const id = setTimeout(() => reportInputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    if (!initialCoacheeId) return
    const exists = activeCoachees.some((coachee) => coachee.id === initialCoacheeId)
    if (!exists) return
    setSelectedCoacheeId(initialCoacheeId)
  }, [activeCoachees, initialCoacheeId])

  const handleContinue = () => {
    const trimmedTitle = reportTitle.trim()
    const sessionTitle = trimmedTitle.length > 0 ? trimmedTitle : defaultTitle
    const createdSessionId = createSession({
      coacheeId: selectedCoacheeId ?? null,
      title: sessionTitle,
      kind: 'written',
      audioBlobId: null,
      audioDurationSeconds: null,
      uploadFileName: null,
    })
    if (!createdSessionId) return
    setWrittenReport(createdSessionId, reportText)
    setTimeout(() => onOpenSession(createdSessionId), 0)
  }

  return (
    <View style={styles.container}>
      {/* Page header */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={({ hovered }) => [styles.backTitleButton, hovered ? styles.backTitleButtonHovered : undefined]}>
          {/* Back and report title */}
          <ChevronLeftIcon color={colors.text} size={24} />
          <Text isSemibold numberOfLines={1} style={styles.headerTitle}>
            {reportTitle || defaultTitle}
          </Text>
        </Pressable>
      </View>

      {/* Controls */}
      <View style={styles.controlsRow}>
        <View style={styles.dropdownRow}>
          <View style={styles.titleInputContainer}>
            {/* Title input */}
            <TextInput
              value={reportTitle}
              onChangeText={setReportTitle}
              placeholder={defaultTitle}
              placeholderTextColor="#656565"
              style={[styles.titleInput, inputWebStyle]}
            />
          </View>
          <View style={[styles.dropdownArea, isCoacheeOpen ? styles.dropdownAreaRaised : undefined]}>
            <Pressable
              onPress={() => {
                setIsCoacheeOpen((value) => !value)
              }}
              style={({ hovered }) => [styles.dropdownPill, hovered ? styles.dropdownPillHovered : undefined]}
            >
              {/* Coachee dropdown */}
              <View style={styles.dropdownPillLeft}>
                <ProfileCircleIcon size={22} />
                <Text numberOfLines={1} isSemibold style={styles.dropdownText}>
                  {selectedCoacheeName}
                </Text>
              </View>
              <ChevronDownIcon color={colors.textStrong} size={20} />
            </Pressable>

            <AnimatedDropdownPanel visible={isCoacheeOpen} style={styles.dropdownPanel}>
              <ScrollView style={styles.dropdownList} contentContainerStyle={styles.dropdownListContent} showsVerticalScrollIndicator={false}>
                {coacheeOptions.map((coachee, index) => {
                  const isFirst = index === 0
                  return (
                    <Pressable
                      key={coachee.id ?? 'coachee-unassigned'}
                      onPress={() => {
                        setSelectedCoacheeId(coachee.id)
                        setIsCoacheeOpen(false)
                      }}
                      style={({ hovered }) => [
                        styles.dropdownItem,
                        isFirst ? styles.dropdownItemTop : undefined,
                        hovered ? styles.dropdownItemHovered : undefined,
                      ]}
                    >
                      {/* Dropdown item */}
                      <Text style={styles.dropdownItemText}>{coachee.name}</Text>
                    </Pressable>
                  )
                })}
                <Pressable
                  onPress={() => {
                    setIsCoacheeOpen(false)
                    onOpenNewCoachee()
                  }}
                  style={({ hovered }) => [
                    styles.dropdownItem,
                    styles.dropdownItemAdd,
                    coacheeOptions.length === 0 ? styles.dropdownItemTop : undefined,
                    styles.dropdownItemBottom,
                    hovered ? styles.dropdownItemAddHovered : undefined,
                  ]}
                >
                  {/* Add coachee */}
                  <Text style={styles.dropdownItemAddText}>+ Nieuwe coachee</Text>
                </Pressable>
              </ScrollView>
            </AnimatedDropdownPanel>
          </View>
        </View>

        <Pressable
          onPress={handleContinue}
          style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
        >
          {/* Continue */}
          <Text isBold style={styles.primaryButtonText}>
            Doorgaan
          </Text>
        </Pressable>
      </View>

      {/* Editor */}
      <View style={styles.editorCard}>
        {isAnyDropdownOpen ? (
          <Pressable
            onPress={() => {
              setIsCoacheeOpen(false)
            }}
            style={styles.dropdownDismissOverlay}
          />
        ) : null}

        <TextInput
          ref={(value) => {
            reportInputRef.current = value
          }}
          value={reportText}
          onChangeText={setReportText}
          multiline
          textAlignVertical="top"
          style={[styles.editorInput, inputWebStyle]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backTitleButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  backTitleButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.textStrong,
    flex: 1,
    minWidth: 0,
  },
  controlsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    zIndex: 50,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  titleInputContainer: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    justifyContent: 'center',
    flex: 1,
  },
  titleInput: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    padding: 0,
  },
  dropdownArea: {
    position: 'relative',
    zIndex: 1,
  },
  dropdownAreaRaised: {
    zIndex: 60,
  },
  dropdownPill: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 210,
  },
  dropdownPillHovered: {
    backgroundColor: colors.hoverBackground,
  },
  dropdownPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  dropdownText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
    flex: 1,
  },
  dropdownPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 44,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...( { boxShadow: '0 8px 20px rgba(0,0,0,0.12)' } as any ),
    zIndex: 70,
    overflow: 'hidden',
  },
  dropdownList: {
    maxHeight: 220,
  },
  dropdownListContent: {
    paddingVertical: 0,
    gap: 0,
  },
  dropdownItem: {
    height: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  dropdownItemTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  dropdownItemBottom: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  dropdownItemHovered: {
    backgroundColor: colors.hoverBackground,
  },
  dropdownItemText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  dropdownItemAdd: {
    backgroundColor: colors.selected,
  },
  dropdownItemAddHovered: {
    backgroundColor: '#A50058',
  },
  dropdownItemAddText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  primaryButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.selected,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 140,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  editorCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  editorInput: {
    width: '100%',
    height: '100%',
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  dropdownDismissOverlay: {
    ...( { position: 'absolute', inset: 0, zIndex: 10 } as any ),
  },
})




