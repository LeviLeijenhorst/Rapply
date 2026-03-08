import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { LoadingSpinner } from '../../../ui/LoadingSpinner'

import { Text } from '../../../ui/Text'
import { colors } from '../../../design/theme/colors'
import { CopyIcon } from '../../../icons/CopyIcon'
import { CopiedIcon } from '../../../icons/CopiedIcon'
import { EditSmallIcon } from '../../../icons/EditSmallIcon'
import { SharePdfIcon } from '../../../icons/SharePdfIcon'
import { ShareTextIcon } from '../../../icons/ShareTextIcon'
import { VerslagGenererenIcon } from '../../../icons/VerslagGenererenIcon'
import { VerslagSchrijvenIcon } from '../../../icons/VerslagSchrijvenIcon'
import { RotateLeftIcon } from '../../../icons/RotateLeftIcon'
import { toUserFriendlyTranscriptionError } from '../../../audio/transcriptionError'
import { richTextMarkdownToHtml } from '../../../ui/richTextFormatting'
import { useToast } from '../../../toast/ToastProvider'
import { parseReportSections, serializeReportSections } from '../../../types/reportStructure'
import { legacySummaryFallbackTitle, structuredSummaryFieldOrder, type StructuredSessionSummary } from '../../../types/structuredSummary'

type Props = {
  onPressTemplate?: () => void
  onPressRegenerate?: () => void
  summary: string | null
  summaryStructured?: StructuredSessionSummary | null
  hasTranscript: boolean
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onRetryTranscription?: () => void
  onEditSummary?: () => void
  onChangeSummary?: (value: string) => void
  onCancelGeneration?: () => void
  onShareSummary?: () => void
  onExportSummaryAsWord?: () => void
  documentNoun?: 'samenvatting' | 'rapportage'
  suppressErrorToast?: boolean
  showCopyAction?: boolean
  fillHeight?: boolean
}

function buildClipboardHtml(markdown: string) {
  const contentHtml = richTextMarkdownToHtml(markdown)
  return [
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12pt; line-height: 1.45; color: #1f1f1f;">',
    contentHtml,
    '</div>',
  ].join('')
}

function ToolbarIconButton({
  onPress,
  disabled = false,
  tooltip,
  style,
  icon,
}: {
  onPress: () => void
  disabled?: boolean
  tooltip: string
  style?: any
  icon: React.ReactNode | ((state: { isHovered: boolean; disabled: boolean }) => React.ReactNode)
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isTooltipRendered, setIsTooltipRendered] = useState(false)
  const tooltipOpacity = useRef(new Animated.Value(0)).current
  const tooltipTranslateY = useRef(new Animated.Value(4)).current

  useEffect(() => {
    if (isHovered && !disabled) {
      setIsTooltipRendered(true)
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tooltipTranslateY, {
          toValue: 0,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 110,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(tooltipTranslateY, {
        toValue: 4,
        duration: 110,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setIsTooltipRendered(false)
    })
  }, [disabled, isHovered, tooltipOpacity, tooltipTranslateY])

  return (
    <View style={styles.iconButtonWrap} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onHoverIn={() => setIsHovered(true)}
        onHoverOut={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        style={({ hovered }) => [
          styles.actionButton,
          disabled ? styles.actionButtonDisabled : undefined,
          hovered ? styles.actionButtonHovered : undefined,
          style,
        ]}
        {...(typeof window !== 'undefined' ? ({ title: tooltip } as any) : {})}
      >
        {typeof icon === 'function' ? icon({ isHovered, disabled }) : icon}
      </Pressable>
      {isTooltipRendered ? (
        <Animated.View
          style={[
            styles.tooltipBox,
            {
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <Text isBold numberOfLines={1} style={styles.tooltipText}>
            {tooltip}
          </Text>
        </Animated.View>
      ) : null}
    </View>
  )
}

export function ReportPanel({
  onPressTemplate,
  onPressRegenerate,
  summary,
  summaryStructured,
  hasTranscript,
  transcriptionStatus,
  transcriptionError,
  onRetryTranscription,
  onEditSummary,
  onChangeSummary,
  onCancelGeneration,
  onShareSummary,
  onExportSummaryAsWord,
  documentNoun = 'samenvatting',
  suppressErrorToast = false,
  showCopyAction = true,
  fillHeight = false,
}: Props) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const [sectionDrafts, setSectionDrafts] = useState(() => parseReportSections(summary || ''))
  const [sectionInputHeights, setSectionInputHeights] = useState<Record<string, number>>({})
  const { showErrorToast } = useToast()
  const readyRevealOpacity = useRef(new Animated.Value(1)).current
  const readyRevealTranslateY = useRef(new Animated.Value(0)).current
  const previousShouldShowLoadingRef = useRef(false)

  const hasSummary = sectionDrafts.length > 0
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const hasError = transcriptionStatus === 'error'
  const shouldShowLoading = (isTranscribing || isGenerating) && !hasError
  const nounLower = documentNoun === 'rapportage' ? 'rapportage' : 'samenvatting'
  const nounUpper = documentNoun === 'rapportage' ? 'Rapportage' : 'Samenvatting'
  const generationErrorMessage =
    documentNoun === 'rapportage'
      ? 'Er is een fout opgetreden bij het genereren van de rapportage.'
      : 'Er is een fout opgetreden bij het genereren van de samenvatting.'
  const loadingLabel = !hasTranscript || isTranscribing ? 'Transcript wordt gegenereerd' : `${nounUpper} wordt gegenereerd`

  const reportCopyText = serializeReportSections(sectionDrafts)
  const showEditSummaryButton = !shouldShowLoading && !!onEditSummary
  const reportErrorMessage = toUserFriendlyTranscriptionError(transcriptionError, generationErrorMessage)
  const isInsufficientMinutesError = reportErrorMessage.toLowerCase().includes('niet genoeg minuten over voor transcriptie')

  useEffect(() => {
    const hasStructuredSummary = Boolean(
      summaryStructured &&
      structuredSummaryFieldOrder.some((field) => String(summaryStructured[field.key] || '').trim().length > 0),
    )
    if (hasStructuredSummary && summaryStructured) {
      const structuredSections = structuredSummaryFieldOrder
        .map((field) => {
          const content = String(summaryStructured[field.key] || '').trim()
          if (!content) return null
          return { title: field.label, content }
        })
        .filter((item): item is { title: string; content: string } => Boolean(item))
      setSectionDrafts(structuredSections)
      return
    }
    if (summary && summary.trim()) {
      setSectionDrafts(parseReportSections(summary || ''))
      return
    }
    setSectionDrafts([])
  }, [summary, summaryStructured])

  useEffect(() => {
    const wasShowingLoading = previousShouldShowLoadingRef.current
    previousShouldShowLoadingRef.current = shouldShowLoading
    const shouldAnimateReadyReveal = wasShowingLoading && !shouldShowLoading && !hasError && hasSummary
    if (!shouldAnimateReadyReveal) {
      readyRevealOpacity.setValue(1)
      readyRevealTranslateY.setValue(0)
      return
    }

    readyRevealOpacity.setValue(0)
    readyRevealTranslateY.setValue(6)
    Animated.parallel([
      Animated.timing(readyRevealOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(readyRevealTranslateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start()
  }, [hasError, hasSummary, readyRevealOpacity, readyRevealTranslateY, shouldShowLoading])

  async function handleCopy() {
    if (!hasSummary) return
    if (typeof navigator === 'undefined' || !navigator.clipboard) return

    try {
      const clipboard = navigator.clipboard as any
      const ClipboardItemCtor = (globalThis as any).ClipboardItem
      if (ClipboardItemCtor && typeof clipboard.write === 'function') {
        const html = buildClipboardHtml(reportCopyText)
        const item = new ClipboardItemCtor({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([reportCopyText], { type: 'text/plain' }),
        })
        await clipboard.write([item])
      } else {
        await navigator.clipboard.writeText(reportCopyText)
      }
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 3000)
    } catch {
      await navigator.clipboard.writeText(reportCopyText)
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 3000)
    }
  }

  useEffect(() => {
    if (!hasError) return
    if (suppressErrorToast) return
    if (isInsufficientMinutesError) return
    showErrorToast(reportErrorMessage, generationErrorMessage)
  }, [generationErrorMessage, hasError, isInsufficientMinutesError, reportErrorMessage, showErrorToast, suppressErrorToast])

  return (
    <View style={[styles.container, fillHeight ? styles.containerFill : undefined]}>
      {/* Report panel */}
      <View style={styles.toolbarRow}>
        <View style={styles.toolbarActions}>
          {onPressTemplate ? (
            <ToolbarIconButton
              onPress={onPressTemplate}
              tooltip={`${nounUpper} genereren`}
              icon={({ isHovered, disabled }) => <VerslagGenererenIcon size={18} color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} />}
            />
          ) : null}
          {onPressRegenerate ? (
            <ToolbarIconButton
              onPress={onPressRegenerate}
              tooltip={`${nounUpper} hergenereren`}
              icon={({ isHovered, disabled }) => <RotateLeftIcon size={18} color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} />}
            />
          ) : null}
          {showEditSummaryButton ? (
            <ToolbarIconButton
              onPress={onEditSummary}
              tooltip={`${nounUpper} bewerken`}
              style={styles.editButton}
              icon={({ isHovered, disabled }) => (
                <EditSmallIcon color={disabled ? '#BDB6B2' : isHovered ? colors.selected : colors.textSecondary} size={17} />
              )}
            />
          ) : null}
          {onShareSummary ? (
            <ToolbarIconButton
              onPress={onShareSummary}
              disabled={!hasSummary}
              tooltip="PDF exporteren"
              icon={({ isHovered, disabled }) => <SharePdfIcon color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} size={18} />}
            />
          ) : null}
          {onExportSummaryAsWord ? (
            <ToolbarIconButton
              onPress={onExportSummaryAsWord}
              disabled={!hasSummary}
              tooltip="Exporteren naar Word"
              icon={({ isHovered, disabled }) => <ShareTextIcon color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} size={18} />}
            />
          ) : null}
          {showCopyAction ? (
            <ToolbarIconButton
              onPress={() => {
                void handleCopy()
              }}
              disabled={!hasSummary}
              tooltip={`Kopieer ${nounLower}`}
              icon={({ isHovered, disabled }) =>
                showCopyNotification ? (
                  <CopiedIcon size={18} />
                ) : (
                  <CopyIcon color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} size={18} />
                )
              }
            />
          ) : null}
        </View>
      </View>

      <Animated.View
        style={[
          styles.reportContent,
          fillHeight ? styles.reportContentFill : undefined,
          { opacity: readyRevealOpacity, transform: [{ translateY: readyRevealTranslateY }] },
        ]}
        id="report-panel-content"
      >
        {shouldShowLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
              <LoadingSpinner size="small" />
              <Text style={styles.loadingText}>{loadingLabel}</Text>
            </View>
            {onCancelGeneration ? (
              <Pressable
                onPress={onCancelGeneration}
                style={({ hovered }) => [styles.cancelButton, hovered ? styles.cancelButtonHovered : undefined]}
              >
                <Text isBold style={styles.cancelText}>
                  annuleren
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : hasError ? (
          <View style={[styles.errorContainer, fillHeight ? styles.stateContainerFill : undefined]}>
            <View style={styles.errorActions}>
              {onRetryTranscription ? (
                <Pressable
                  onPress={onRetryTranscription}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagGenererenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    {nounUpper} genereren
                  </Text>
                </Pressable>
              ) : null}
              {onEditSummary ? (
                <Pressable
                  onPress={onEditSummary}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagSchrijvenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    {nounUpper} schrijven
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : hasSummary ? (
          <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryScrollContent} showsVerticalScrollIndicator>
            <View style={styles.summaryContent}>
              {sectionDrafts.map((section, index) => (
                <View key={`${section.title}-${index}`} style={styles.sectionBlock}>
                  <Text isSemibold style={styles.sectionTitle}>
                    {section.title || legacySummaryFallbackTitle}
                  </Text>
                  <TextInput
                    multiline
                    scrollEnabled={false}
                    value={section.content}
                    placeholder="Vul dit onderdeel in..."
                    placeholderTextColor={colors.textSecondary}
                    onContentSizeChange={(event) => {
                      const targetHeight = Math.max(88, Math.ceil(event.nativeEvent.contentSize.height))
                      const key = `${section.title}-${index}`
                      setSectionInputHeights((current) => (current[key] === targetHeight ? current : { ...current, [key]: targetHeight }))
                    }}
                    style={[
                      styles.sectionInput,
                      sectionInputHeights[`${section.title}-${index}`] ? { height: sectionInputHeights[`${section.title}-${index}`] } : undefined,
                    ]}
                    onChangeText={(nextValue) => {
                      const nextDrafts = sectionDrafts.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, content: nextValue } : item,
                      )
                      setSectionDrafts(nextDrafts)
                      if (!onChangeSummary) return
                      onChangeSummary(serializeReportSections(nextDrafts))
                    }}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={[styles.emptyContainer, fillHeight ? styles.stateContainerFill : undefined]}>
            <View style={styles.emptyActions}>
              {onRetryTranscription ? (
                <Pressable
                  onPress={onRetryTranscription}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagGenererenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    {nounUpper} genereren
                  </Text>
                </Pressable>
              ) : null}
              {onEditSummary ? (
                <Pressable
                  onPress={onEditSummary}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagSchrijvenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    {nounUpper} schrijven
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  containerFill: {
    flex: 1,
  },
  toolbarRow: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 30,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    zIndex: 31,
  },
  iconButtonWrap: {
    position: 'relative',
  },
  editButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  reportContent: {
    width: '100%',
    position: 'relative',
    zIndex: 1,
    minHeight: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  reportContentFill: {
    flex: 1,
    minHeight: 0,
  },
  summaryScroll: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    borderRadius: 12,
    ...( { overflowY: 'auto' } as any ),
  },
  summaryScrollContent: {
    paddingBottom: 12,
  },
  summaryContent: {
    width: '100%',
    gap: 12,
    paddingRight: 4,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textStrong,
  },
  sectionInput: {
    width: '100%',
    minHeight: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    textAlignVertical: 'top',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  tooltipBox: {
    position: 'absolute',
    top: 38,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    zIndex: 20,
    minWidth: 128,
    maxWidth: 220,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...( { boxShadow: '0 3px 8px rgba(23, 28, 31, 0.08)' } as any ),
  },
  tooltipText: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.textStrong,
    ...( { whiteSpace: 'nowrap' } as any ),
  },
  copyNotification: {
    position: 'absolute',
    left: 0,
    top: 36,
    padding: 0,
  },
  copyNotificationText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
  },
  loadingContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  cancelButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelButtonHovered: {
    opacity: 0.75,
  },
  cancelText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
    textAlign: 'center',
  },
  errorContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateContainerFill: {
    flex: 1,
  },
  emptyActions: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  emptyActionButtonHovered: {
    opacity: 0.75,
  },
  emptyActionText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.selected,
    textAlign: 'center',
  },
})


