import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { StandaardVerslagIcon } from '../icons/StandaardVerslagIcon'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'
import { ShareTranscriptIcon } from '../icons/ShareTranscriptIcon'

type Props = {
  templateLabel: string
  onPressTemplate: () => void
  isCompact?: boolean
  summary: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onRetryTranscription?: () => void
}

function renderSummaryWithHeadings(summary: string) {
  const lines = summary.replace(/\r/g, '').split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const headingMatch = line.match(/^\s*###\s*(.+?)\s*$/)
    if (headingMatch) {
      elements.push(
        <Text key={`h-${i}`} style={styles.sectionTitle}>
          {headingMatch[1]}
        </Text>,
      )
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
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>,
      )
      continue
    }

    if (line.trim()) {
      elements.push(
        <Text key={`p-${i}`} style={styles.paragraph}>
          {line}
        </Text>,
      )
    } else if (i < lines.length - 1) {
      elements.push(<View key={`spacer-${i}`} style={{ height: 8 }} />)
    }
  }

  return elements
}

export function ReportPanel({ templateLabel, onPressTemplate, isCompact, summary, transcriptionStatus, transcriptionError, onRetryTranscription }: Props) {
  const [showCopyNotification, setShowCopyNotification] = useState(false)

  const isLoading = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'
  const hasError = transcriptionStatus === 'error'
  const hasContent = transcriptionStatus === 'done' && summary

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
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
              <Text style={styles.loadingText}>
                {transcriptionStatus === 'transcribing' ? 'Transcriptie wordt gegenereerd...' : 'Verslag wordt gegenereerd...'}
              </Text>
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
        ) : hasContent ? (
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
          <Pressable
            onPress={async () => {
              if (typeof window === 'undefined' || !summary) return
              const { default: jsPDF } = await import('jspdf')
              const { default: html2canvas } = await import('html2canvas')
              const input = document.getElementById('report-panel-content')
              if (!input) return
              const canvas = await html2canvas(input)
              const imgData = canvas.toDataURL('image/png')
              const pdf = new jsPDF()
              const imgProps = pdf.getImageProperties(imgData)
              const pdfWidth = pdf.internal.pageSize.getWidth()
              const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
              pdf.save('verslag.pdf')
            }}
            style={({ hovered }) => [styles.actionButton, hovered ? styles.actionButtonHovered : undefined, !summary ? styles.actionButtonDisabled : undefined]}
          >
            <ShareTranscriptIcon color="#8E8480" size={18} />
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
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
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

