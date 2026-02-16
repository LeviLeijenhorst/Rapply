import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'
import { EditSmallIcon } from '../icons/EditSmallIcon'
import { VerslagGenererenIcon } from '../icons/VerslagGenererenIcon'
import { VerslagSchrijvenIcon } from '../icons/VerslagSchrijvenIcon'
import { toUserFriendlyTranscriptionError } from '../../utils/transcriptionError'
import { parseRichTextMarkdown, RichTextInlineSegment, richTextSharedFormatting } from '../../utils/richTextFormatting'

type Props = {
  templateLabel: string
  onPressTemplate: () => void
  isCompact?: boolean
  summary: string | null
  hasTranscript: boolean
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onRetryTranscription?: () => void
  onEditSummary?: () => void
  onCancelGeneration?: () => void
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

export function ReportPanel({
  templateLabel,
  onPressTemplate,
  isCompact,
  summary,
  hasTranscript,
  transcriptionStatus,
  transcriptionError,
  onRetryTranscription,
  onEditSummary,
  onCancelGeneration,
}: Props) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  const hasSummary = Boolean(summary && summary.trim())
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const hasError = transcriptionStatus === 'error'
  const shouldShowLoading = (isTranscribing || isGenerating) && !hasError
  const loadingLabel = !hasTranscript || isTranscribing ? 'Transcript wordt gegenereerd' : 'Verslag wordt gegenereerd'

  const reportCopyText = summary || ''
  const showEditSummaryButton = !shouldShowLoading && !hasError && !!onEditSummary

  const summaryLines = parseRichTextMarkdown(summary || '')

  return (
    <View style={styles.container}>
      {/* Report panel */}
      <View style={styles.toolbarRow}>
        {/* Template button */}
        <Pressable
          onPress={onPressTemplate}
          style={({ hovered }) => [
            styles.templateButton,
            isCompact ? styles.templateButtonCompact : undefined,
            hovered ? styles.templateButtonHovered : undefined,
          ]}
        >
          <StandaardVerslagIcon color={colors.textStrong} size={18} />
          {!isCompact ? (
            <Text isSemibold style={styles.templateButtonText}>
              {templateLabel}
            </Text>
          ) : null}
        </Pressable>
        {showEditSummaryButton ? (
          <Pressable onPress={onEditSummary} style={({ hovered }) => [styles.editButton, hovered ? styles.editButtonHovered : undefined]}>
            {({ hovered }) => <EditSmallIcon color={hovered ? colors.selected : colors.textSecondary} size={17} />}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.reportContent} id="report-panel-content">
        {shouldShowLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
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
            <Text style={styles.errorText}>
              {toUserFriendlyTranscriptionError(transcriptionError, 'Er is een fout opgetreden bij het genereren van het verslag.')}
            </Text>
            {onRetryTranscription ? (
              <Pressable
                onPress={onRetryTranscription}
                style={({ hovered }) => [styles.retryButton, hovered ? styles.retryButtonHovered : undefined]}
              >
                {/* Retry report */}
                <Text isBold style={styles.retryButtonText}>
                  Opnieuw proberen
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : hasSummary ? (
          <View style={styles.summaryContent}>
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

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => {
              if (typeof navigator === 'undefined') return
              navigator.clipboard?.writeText(reportCopyText).then(() => {
                setShowCopyNotification(true)
                setTimeout(() => setShowCopyNotification(false), 3000)
              })
            }}
            style={({ hovered }) => [styles.actionButton, hovered ? styles.actionButtonHovered : undefined]}
          >
            {showCopyNotification ? <CopiedIcon size={18} /> : <CopyIcon color="#8E8480" size={18} />}
          </Pressable>
        </View>
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
    justifyContent: 'space-between',
  },
  templateButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  templateButtonCompact: {
    width: 40,
    padding: 0,
  },
  templateButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  templateButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
  },
  summaryContent: {
    width: '100%',
    gap: 8,
  },
  paragraph: {
    fontSize: richTextSharedFormatting.editorFontSize,
    lineHeight: richTextSharedFormatting.editorLineHeight,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: richTextSharedFormatting.headingFontSize,
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
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    position: 'relative',
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
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.selected,
  },
  retryButton: {
    height: 36,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  retryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
