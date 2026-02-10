import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'

type Props = {
  templateLabel: string
  onPressTemplate: () => void
  isCompact?: boolean
  summary: string | null
  hasTranscript: boolean
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onRetryTranscription?: () => void
}

function renderInlineText(text: string, textStyle: any) {
  const parts = String(text || '').split('**')
  return (
    <Text style={textStyle}>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <Text key={`bold-${index}`} isBold>
            {part}
          </Text>
        ) : (
          <Text key={`text-${index}`}>{part}</Text>
        ),
      )}
    </Text>
  )
}

function renderSummaryWithHeadings(summary: string) {
  const lines = summary.replace(/\r/g, '').split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const dividerMatch = line.match(/^\s*---\s*$/)
    if (dividerMatch) {
      elements.push(
        <View key={`hr-${i}`} style={styles.dividerRow}>
          <View style={styles.dividerLine} />
        </View>,
      )
      continue
    }

    const headingMatch = line.match(/^\s*###\s*(.+?)\s*$/)
    if (headingMatch) {
      const rawText = headingMatch[1]
      const cleanText = rawText.replace(/^\s*#\s*/, '').trim()
      elements.push(<View key={`h-${i}`}>{renderInlineText(cleanText, styles.sectionTitle)}</View>)
      continue
    }

    const bulletMatch = line.match(/^\s*[-*]\s+(.+?)\s*$/)
    if (bulletMatch) {
      const items: string[] = []
      let index = i
      while (index < lines.length) {
        const currentLine = lines[index]
        const match = currentLine.match(/^\s*[-*]\s+(.+?)\s*$/)
        if (!match) break
        items.push(match[1])
        index += 1
      }
      i = index - 1

      elements.push(
        <View key={`ul-${i}`} style={styles.bullets}>
          {items.map((item, itemIndex) => (
            <View key={`li-${i}-${itemIndex}`} style={styles.bulletRow}>
              <Text style={styles.bulletSymbol}>•</Text>
              <View style={styles.bulletTextContainer}>{renderInlineText(item, styles.bulletText)}</View>
            </View>
          ))}
        </View>,
      )
      continue
    }

    if (line.trim()) {
      elements.push(<View key={`p-${i}`}>{renderInlineText(line, styles.paragraph)}</View>)
    } else if (i < lines.length - 1) {
      elements.push(<View key={`spacer-${i}`} style={{ height: 8 }} />)
    }
  }

  return elements
}

export function ReportPanel({ templateLabel, onPressTemplate, isCompact, summary, hasTranscript, transcriptionStatus, transcriptionError, onRetryTranscription }: Props) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  const hasSummary = Boolean(summary && summary.trim())
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const hasError = transcriptionStatus === 'error'
  const shouldShowLoading = (isTranscribing || isGenerating) && !hasError
  const loadingLabel = !hasTranscript || isTranscribing ? 'Transcript wordt gegenereerd' : 'Verslag wordt gegenereerd'

  const reportCopyText = summary || ''

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
      </View>

      <View style={styles.reportContent} id="report-panel-content">
        {shouldShowLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
              <Text style={styles.loadingText}>{loadingLabel}</Text>
            </View>
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {transcriptionError || 'Er is een fout opgetreden bij het genereren van het verslag.'}
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
            {renderSummaryWithHeadings(summary || '')}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen verslag beschikbaar</Text>
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
  reportContent: {
    width: '100%',
    gap: 12,
  },
  summaryContent: {
    width: '100%',
    gap: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
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
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  bulletText: {
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  bulletTextContainer: {
    flex: 1,
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
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})

