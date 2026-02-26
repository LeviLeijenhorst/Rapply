import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native'
import { LoadingSpinner } from '../LoadingSpinner'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'
import { EditSmallIcon } from '../icons/EditSmallIcon'
import { SharePdfIcon } from '../icons/SharePdfIcon'
import { ShareTextIcon } from '../icons/ShareTextIcon'
import { VerslagGenererenIcon } from '../icons/VerslagGenererenIcon'
import { VerslagSchrijvenIcon } from '../icons/VerslagSchrijvenIcon'
import { toUserFriendlyTranscriptionError } from '../../utils/transcriptionError'
import { parseRichTextMarkdown, RichTextInlineSegment, richTextMarkdownToHtml, richTextSharedFormatting } from '../../utils/richTextFormatting'
import { useToast } from '../../toast/ToastProvider'

type Props = {
  onPressTemplate?: () => void
  summary: string | null
  hasTranscript: boolean
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onRetryTranscription?: () => void
  onEditSummary?: () => void
  onCancelGeneration?: () => void
  onShareSummary?: () => void
  onExportSummaryAsWord?: () => void
  suppressErrorToast?: boolean
}

function renderInlineSegments(segments: RichTextInlineSegment[], textStyle: any) {
  return (
    <Text style={textStyle}>
      {segments.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          isBold={segment.isBold}
          style={segment.isItalic ? styles.italicText : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  )
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
  summary,
  hasTranscript,
  transcriptionStatus,
  transcriptionError,
  onRetryTranscription,
  onEditSummary,
  onCancelGeneration,
  onShareSummary,
  onExportSummaryAsWord,
  suppressErrorToast = false,
}: Props) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const { showErrorToast } = useToast()

  const hasSummary = Boolean(summary && summary.trim())
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const hasError = transcriptionStatus === 'error'
  const shouldShowLoading = (isTranscribing || isGenerating) && !hasError
  const loadingLabel = !hasTranscript || isTranscribing ? 'Transcript wordt gegenereerd' : 'Verslag wordt gegenereerd'

  const reportCopyText = summary || ''
  const showEditSummaryButton = !shouldShowLoading && !!onEditSummary

  const summaryLines = parseRichTextMarkdown(summary || '')
  const reportErrorMessage = toUserFriendlyTranscriptionError(transcriptionError, 'Er is een fout opgetreden bij het genereren van het verslag.')
  const isInsufficientMinutesError = reportErrorMessage.toLowerCase().includes('niet genoeg minuten over voor transcriptie')

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
    showErrorToast(reportErrorMessage, 'Er is een fout opgetreden bij het genereren van het verslag.')
  }, [hasError, isInsufficientMinutesError, reportErrorMessage, showErrorToast, suppressErrorToast])

  return (
    <View style={styles.container}>
      {/* Report panel */}
      <View style={styles.toolbarRow}>
        <View style={styles.toolbarActions}>
          {onPressTemplate ? (
            <ToolbarIconButton
              onPress={onPressTemplate}
              tooltip="Verslag genereren"
              icon={({ isHovered, disabled }) => <VerslagGenererenIcon size={18} color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} />}
            />
          ) : null}
          {showEditSummaryButton ? (
            <ToolbarIconButton
              onPress={onEditSummary}
              tooltip="Verslag bewerken"
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
          <ToolbarIconButton
            onPress={() => {
              void handleCopy()
            }}
            disabled={!hasSummary}
            tooltip="Kopieer verslag"
            icon={({ isHovered, disabled }) =>
              showCopyNotification ? (
                <CopiedIcon size={18} />
              ) : (
                <CopyIcon color={disabled ? '#BDB6B2' : isHovered ? colors.selected : '#8E8480'} size={18} />
              )
            }
          />
        </View>
      </View>

      <View style={styles.reportContent} id="report-panel-content">
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
          <View style={styles.errorContainer}>
            <View style={styles.errorActions}>
              {onRetryTranscription ? (
                <Pressable
                  onPress={onRetryTranscription}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagGenererenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    Verslag genereren
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
                    Verslag schrijven
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : hasSummary ? (
          <View style={styles.summaryContent}>
            <View style={styles.summaryInner}>
              {summaryLines.map((line, index) => {
                if (line.kind === 'empty') return <View key={`empty-${index}`} style={styles.emptyRow} />
                if (line.kind === 'divider') {
                  return (
                    <View key={`divider-${index}`} style={styles.dividerRow}>
                      <View style={styles.dividerLine} />
                    </View>
                  )
                }
                if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
                  return <View key={`heading-${index}`}>{renderInlineSegments(line.segments, styles.sectionTitle)}</View>
                }
                if (line.kind === 'bullet') {
                  return (
                    <View key={`bullet-${index}`} style={styles.bulletRow}>
                      <View style={styles.bulletSymbol} />
                      <View style={styles.bulletTextContainer}>{renderInlineSegments(line.segments, styles.bulletText)}</View>
                    </View>
                  )
                }
                if (line.kind === 'numbered') {
                  return (
                    <View key={`numbered-${index}`} style={styles.bulletRow}>
                      <Text style={styles.bulletNumber}>{`${line.number}.`}</Text>
                      <View style={styles.bulletTextContainer}>{renderInlineSegments(line.segments, styles.bulletText)}</View>
                    </View>
                  )
                }
                if (line.kind === 'quote') {
                  return (
                    <View key={`quote-${index}`} style={styles.quoteRow}>
                      {renderInlineSegments(line.segments, styles.quoteText)}
                    </View>
                  )
                }
                return <View key={`paragraph-${index}`}>{renderInlineSegments(line.segments, styles.paragraph)}</View>
              })}
            </View>
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyActions}>
              {onRetryTranscription ? (
                <Pressable
                  onPress={onRetryTranscription}
                  style={({ hovered }) => [styles.emptyActionButton, hovered ? styles.emptyActionButtonHovered : undefined]}
                >
                  <VerslagGenererenIcon size={24} color={colors.selected} />
                  <Text isBold style={styles.emptyActionText}>
                    Verslag genereren
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
                    Verslag schrijven
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 16,
  },
  toolbarRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 30,
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
    gap: 12,
    position: 'relative',
    zIndex: 1,
  },
  summaryContent: {
    width: '100%',
    paddingRight: 4,
  },
  summaryInner: {
    width: '100%',
    gap: 8,
  },
  paragraph: {
    fontSize: richTextSharedFormatting.editorFontSize,
    lineHeight: richTextSharedFormatting.editorLineHeight,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: richTextSharedFormatting.headingTwoFontSize,
    lineHeight: richTextSharedFormatting.headingLineHeight,
    fontWeight: richTextSharedFormatting.headingFontWeight,
    color: colors.textStrong,
  },
  dividerRow: {
    width: '100%',
    paddingVertical: 8,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
  },
  bullets: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletSymbol: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.text,
    marginTop: 10,
  },
  bulletText: {
    fontSize: richTextSharedFormatting.listFontSize,
    lineHeight: richTextSharedFormatting.listLineHeight,
    color: colors.text,
  },
  bulletTextContainer: {
    flex: 1,
  },
  bulletNumber: {
    fontSize: richTextSharedFormatting.listFontSize,
    lineHeight: richTextSharedFormatting.listLineHeight,
    fontWeight: richTextSharedFormatting.listMarkerFontWeight,
    color: colors.text,
    minWidth: 20,
  },
  italicText: {
    fontStyle: 'italic',
  },
  emptyRow: {
    height: 8,
  },
  quoteRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: 10,
  },
  quoteText: {
    fontSize: richTextSharedFormatting.editorFontSize,
    lineHeight: richTextSharedFormatting.editorLineHeight,
    color: colors.textSecondary,
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
