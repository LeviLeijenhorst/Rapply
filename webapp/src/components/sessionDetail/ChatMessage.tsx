import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'
import { SharePdfIcon } from '../icons/SharePdfIcon'
import { parseTimeLabelToSeconds } from '../../utils/time'
import { useLocalAppData } from '../../local/LocalAppDataProvider'
import { parseRichTextMarkdown, RichTextInlineSegment } from '../../utils/richTextFormatting'

type Props = {
  role: 'user' | 'assistant'
  text: string
  isLoading?: boolean
  onTranscriptMentionPress?: (seconds: number) => void
  exportTitle?: string
  onRequestPdfEdit?: (params: { text: string; title?: string; practiceSettings: PdfPracticeSettings }) => void
}

const pdfStartToken = '[[PDF_START]]'
const pdfEndToken = '[[PDF_END]]'

function extractExportableText(text: string) {
  const rawText = String(text || '')
  const startIndex = rawText.indexOf(pdfStartToken)
  const endIndex = rawText.indexOf(pdfEndToken)
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return null
  }
  const contentStart = startIndex + pdfStartToken.length
  return rawText.slice(contentStart, endIndex).trim()
}

function removeExportMarkers(text: string) {
  return String(text || '').replace(pdfStartToken, '').replace(pdfEndToken, '').trim()
}

type MentionToken = {
  kind: 'text' | 'mention'
  text: string
  timeLabel?: string
}

type DocumentSegment = {
  text: string
  isBold: boolean
}

type DocumentLine = {
  kind: 'headingTwo' | 'headingThree' | 'bullet' | 'numbered' | 'quote' | 'divider' | 'paragraph' | 'empty'
  number?: number
  segments: DocumentSegment[]
}

type PdfPracticeSettings = {
  practiceName: string
  website: string
  tintColor: string
  logoDataUrl: string | null
}

function buildMentionTokens(text: string): MentionToken[] {
  const tokens: MentionToken[] = []
  const mentionPattern =
    /\[\[\s*(?:timestamp|time|bron|source)\s*=\s*([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:[.,][0-9]+)?)\s*(?:\|\s*([^\]]+?)\s*)?\]\]|\[([0-9]{1,2}:[0-9]{2}(?::[0-9]{2})?(?:[.,][0-9]+)?)\]/gi
  let lastIndex = 0
  let match = mentionPattern.exec(text)
  while (match) {
    const start = match.index
    if (start > lastIndex) {
      tokens.push({ kind: 'text', text: text.slice(lastIndex, start) })
    }
    const timeLabel = String(match[1] || match[3] || '').trim()
    const label = String(match[2] || '').trim()
    tokens.push({ kind: 'mention', text: label || timeLabel, timeLabel })
    lastIndex = start + match[0].length
    match = mentionPattern.exec(text)
  }
  if (lastIndex < text.length) {
    tokens.push({ kind: 'text', text: text.slice(lastIndex) })
  }
  return tokens
}

function buildBoldSegments(text: string) {
  return String(text || '').split('**').map((part, index) => ({
    text: part,
    isBold: index % 2 === 1,
  }))
}

function MessageText({
  text,
  textStyle,
  boldStyle,
  onTranscriptMentionPress,
}: {
  text: string
  textStyle: any
  boldStyle?: any
  onTranscriptMentionPress?: (seconds: number) => void
}) {
  const tokens = useMemo(() => buildMentionTokens(text), [text])
  return (
    <Text style={textStyle}>
      {tokens.map((token, tokenIndex) => {
        if (token.kind === 'mention') {
          const seconds = token.timeLabel ? parseTimeLabelToSeconds(token.timeLabel) : null
          if (seconds === null || !onTranscriptMentionPress) {
            return (
              <Text key={`mention-${tokenIndex}`} style={textStyle}>
                {token.text}
              </Text>
            )
          }
          return (
            <TranscriptMention
              key={`mention-${tokenIndex}`}
              label={token.text}
              seconds={seconds}
              onPress={onTranscriptMentionPress}
            />
          )
        }
        const segments = buildBoldSegments(token.text)
        return segments.map((segment, segmentIndex) => (
          <Text key={`segment-${tokenIndex}-${segmentIndex}`} isBold={segment.isBold} style={segment.isBold ? boldStyle : undefined}>
            {segment.text}
          </Text>
        ))
      })}
    </Text>
  )
}

function TranscriptMention({ label, seconds, onPress }: { label: string; seconds: number; onPress: (seconds: number) => void }) {
  const [isHovered, setIsHovered] = useState(false)
  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  } as any
  return (
    <Text
      isBold
      onPress={() => onPress(seconds)}
      accessibilityRole="link"
      style={[styles.transcriptMention, isHovered ? styles.transcriptMentionHovered : undefined]}
      {...hoverProps}
    >
      {label}
    </Text>
  )
}

function splitBoldSegments(text: string, forceBold = false): DocumentSegment[] {
  const rawText = String(text || '')
  if (forceBold) {
    return [{ text: rawText.replace(/\*\*/g, ''), isBold: true }]
  }
  const parts = rawText.split('**')
  return parts.map((part, index) => ({ text: part, isBold: index % 2 === 1 }))
}

function splitSegmentsIntoTokens(segments: DocumentSegment[]) {
  const tokens: DocumentSegment[] = []
  segments.forEach((segment) => {
    const parts = segment.text.split(/(\s+)/)
    parts.forEach((part) => {
      if (!part) return
      tokens.push({ text: part, isBold: segment.isBold })
    })
  })
  return tokens
}

function wrapSegmentsToLines(document: any, segments: DocumentSegment[], maxWidth: number, fontSize: number) {
  const tokens = splitSegmentsIntoTokens(segments)
  const lines: DocumentSegment[][] = []
  let currentLine: DocumentSegment[] = []
  let currentWidth = 0

  tokens.forEach((token) => {
    if (!token.text.trim() && currentLine.length === 0) return
    document.setFont('Helvetica', token.isBold ? 'bold' : 'normal')
    document.setFontSize(fontSize)
    const tokenWidth = document.getTextWidth(token.text)

    if (currentLine.length > 0 && currentWidth + tokenWidth > maxWidth) {
      lines.push(currentLine)
      currentLine = []
      currentWidth = 0
    }

    currentLine.push(token)
    currentWidth += tokenWidth
  })

  if (currentLine.length > 0) lines.push(currentLine)
  return lines
}

function buildDocumentLines(messageText: string): DocumentLine[] {
  const lines = parseRichTextMarkdown(messageText)
  return lines.map((line) => {
    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
      const text = line.segments.map((segment) => segment.text).join('')
      return { kind: line.kind, segments: splitBoldSegments(text, true) }
    }
    if (line.kind === 'bullet' || line.kind === 'paragraph' || line.kind === 'quote') {
      return { kind: line.kind, segments: splitBoldSegments(line.text) }
    }
    if (line.kind === 'numbered') {
      return { kind: line.kind, number: line.number, segments: splitBoldSegments(line.text) }
    }
    return { kind: line.kind, segments: [] }
  })
}

function guessTitleFromLines(lines: DocumentLine[]) {
  const firstHeader = lines.find((l) => l.kind === 'headingTwo' || l.kind === 'headingThree')
  const raw = firstHeader?.segments.map((s) => s.text).join('')?.trim()
  return raw || 'CoachScribe export'
}

function addFooters(
  document: any,
  footerLineY: number,
  marginLeft: number,
  marginRight: number,
  footerFontSize: number,
  websiteLabel: string,
  practiceNameLabel: string,
) {
  const pageCount = document.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    document.setPage(i)
    const pageWidth = document.internal.pageSize.getWidth()
    const pageHeight = document.internal.pageSize.getHeight()
    document.setDrawColor(190, 1, 101)
    document.setLineWidth(1)
    document.line(marginLeft, footerLineY, pageWidth - marginRight, footerLineY)
    document.setFont('Helvetica', 'normal')
    document.setFontSize(footerFontSize)
    document.setTextColor(38, 52, 63)
    const pageLabel = String(i)
    const pageLabelWidth = document.getTextWidth(pageLabel)
    document.text(pageLabel, pageWidth - marginRight - pageLabelWidth, pageHeight - 28)
    if (websiteLabel) {
      const websiteWidth = document.getTextWidth(websiteLabel)
      document.text(websiteLabel, pageWidth - marginRight - websiteWidth, pageHeight - 12)
    }
    if (practiceNameLabel) {
      document.text(practiceNameLabel, marginLeft, pageHeight - 12)
    }
  }
}

function buildPdfFileName(title: string) {
  const rawTitle = String(title || '').trim() || 'Verslag'
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  return `${safeTitle || 'Verslag'}.pdf`
}

export async function exportMessageToPdf(messageText: string, reportTitle: string | undefined, practiceSettings: PdfPracticeSettings) {
  if (typeof window === 'undefined') return
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const marginTop = 52
  const marginLeft = 52
  const marginRight = 52
  const footerHeight = 56
  const footerLineY = pageHeight - footerHeight
  const contentX = marginLeft
  const maxWidth = pageWidth - marginLeft - marginRight

  const lineHeight = 16
  const headerFontSize = 12
  const textFontSize = 11
  const footerFontSize = 9

  const textColor = { r: 38, g: 52, b: 63 }
  const strongTextColor = { r: 29, g: 10, b: 0 }

  let cursorY = marginTop

  const lines = buildDocumentLines(messageText)
  const headerLineIndexes = lines.flatMap((line, index) => (line.kind === 'headingTwo' || line.kind === 'headingThree' ? [index] : []))
  const fallbackTitle = lines[headerLineIndexes[0]]?.segments.map((segment) => segment.text).join('').trim()
  const title = String(reportTitle || '').trim() || fallbackTitle || 'CoachScribe export'

  const ensureSpace = (needed: number) => {
    if (cursorY + needed <= footerLineY - 12) return
    doc.addPage()
    cursorY = marginTop
  }

  lines.forEach((line) => {
    if (line.kind === 'empty') {
      ensureSpace(lineHeight)
      cursorY += lineHeight
      return
    }

    if (line.kind === 'divider') {
      ensureSpace(lineHeight)
      doc.setDrawColor(210, 210, 210)
      doc.setLineWidth(0.7)
      doc.line(contentX, cursorY + 6, pageWidth - marginRight, cursorY + 6)
      cursorY += lineHeight
      return
    }

    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth, headerFontSize)
      wrapped.forEach((segments, idx) => {
        ensureSpace(lineHeight)
        let x = contentX
        doc.setFontSize(headerFontSize)
        segments.forEach((seg) => {
          doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
          doc.setTextColor(strongTextColor.r, strongTextColor.g, strongTextColor.b)
          doc.text(seg.text, x, cursorY)
          x += doc.getTextWidth(seg.text)
        })
        cursorY += lineHeight
        if (idx === 0) cursorY += 2
      })
      cursorY += 4
      return
    }

    if (line.kind === 'bullet') {
      const wrapped = wrapSegmentsToLines(doc, [{ text: '\u2022 ', isBold: false }, ...line.segments], maxWidth, textFontSize)
      wrapped.forEach((segments) => {
        ensureSpace(lineHeight)
        let x = contentX
        segments.forEach((seg) => {
          doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
          doc.setFontSize(textFontSize)
          doc.setTextColor(textColor.r, textColor.g, textColor.b)
          doc.text(seg.text, x, cursorY)
          x += doc.getTextWidth(seg.text)
        })
        cursorY += lineHeight
      })
      return
    }

    if (line.kind === 'numbered') {
      const wrapped = wrapSegmentsToLines(doc, [{ text: `${line.number || 1}. `, isBold: false }, ...line.segments], maxWidth, textFontSize)
      wrapped.forEach((segments) => {
        ensureSpace(lineHeight)
        let x = contentX
        segments.forEach((seg) => {
          doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
          doc.setFontSize(textFontSize)
          doc.setTextColor(textColor.r, textColor.g, textColor.b)
          doc.text(seg.text, x, cursorY)
          x += doc.getTextWidth(seg.text)
        })
        cursorY += lineHeight
      })
      return
    }

    if (line.kind === 'quote') {
      const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth - 8, textFontSize)
      wrapped.forEach((segments) => {
        ensureSpace(lineHeight)
        doc.setDrawColor(210, 210, 210)
        doc.setLineWidth(1)
        doc.line(contentX, cursorY - 11, contentX, cursorY + 3)
        let x = contentX + 8
        segments.forEach((seg) => {
          doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
          doc.setFontSize(textFontSize)
          doc.setTextColor(textColor.r, textColor.g, textColor.b)
          doc.text(seg.text, x, cursorY)
          x += doc.getTextWidth(seg.text)
        })
        cursorY += lineHeight
      })
      return
    }

    // normal text
    const wrapped = wrapSegmentsToLines(doc, line.segments, maxWidth, textFontSize)
    wrapped.forEach((segments) => {
      ensureSpace(lineHeight)
      let x = contentX
      segments.forEach((seg) => {
        doc.setFont('Helvetica', seg.isBold ? 'bold' : 'normal')
        doc.setFontSize(textFontSize)
        doc.setTextColor(textColor.r, textColor.g, textColor.b)
        doc.text(seg.text, x, cursorY)
        x += doc.getTextWidth(seg.text)
      })
      cursorY += lineHeight
    })
  })

  addFooters(
    doc,
    footerLineY,
    marginLeft,
    marginRight,
    footerFontSize,
    String(practiceSettings.website || '').trim(),
    String(practiceSettings.practiceName || '').trim(),
  )
  const fileName = buildPdfFileName(title)
  const pdfBlob = doc.output('blob')
  const downloadUrl = URL.createObjectURL(pdfBlob)
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
}

function renderInlineSegments({
  segments,
  textStyle,
  boldStyle,
  onTranscriptMentionPress,
}: {
  segments: RichTextInlineSegment[]
  textStyle: any
  boldStyle?: any
  onTranscriptMentionPress?: (seconds: number) => void
}) {
  return (
    <Text style={textStyle}>
      {segments.map((segment, segmentIndex) => {
        const segmentTokens = buildMentionTokens(segment.text)
        return segmentTokens.map((token, tokenIndex) => {
          if (token.kind === 'mention') {
            const seconds = token.timeLabel ? parseTimeLabelToSeconds(token.timeLabel) : null
            if (seconds === null || !onTranscriptMentionPress) {
              return (
                <Text key={`mention-${segmentIndex}-${tokenIndex}`} style={segment.isItalic ? styles.italicText : undefined} isBold={segment.isBold}>
                  {token.text}
                </Text>
              )
            }
            return (
              <TranscriptMention
                key={`mention-${segmentIndex}-${tokenIndex}`}
                label={token.text}
                seconds={seconds}
                onPress={onTranscriptMentionPress}
              />
            )
          }
          return (
            <Text
              key={`text-${segmentIndex}-${tokenIndex}`}
              isBold={segment.isBold}
              style={[
                segment.isItalic ? styles.italicText : undefined,
                segment.isBold ? boldStyle : undefined,
              ]}
            >
              {token.text}
            </Text>
          )
        })
      })}
    </Text>
  )
}

export function ChatMessage({ role, text, isLoading, onTranscriptMentionPress, exportTitle, onRequestPdfEdit }: Props) {
  const { data } = useLocalAppData()
  const pdfPracticeSettings = useMemo<PdfPracticeSettings>(
    () => ({
      practiceName: data.practiceSettings.practiceName,
      website: data.practiceSettings.website,
      tintColor: data.practiceSettings.tintColor,
      logoDataUrl: data.practiceSettings.logoDataUrl,
    }),
    [data.practiceSettings.logoDataUrl, data.practiceSettings.practiceName, data.practiceSettings.tintColor, data.practiceSettings.website],
  )
  const isAssistant = role === 'assistant'
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const exportableText = extractExportableText(text)
  const displayText = removeExportMarkers(text)
  const lines = parseRichTextMarkdown(displayText || '')
  const isExportable = isAssistant && Boolean(exportableText)

  if (isAssistant) {
    return (
      <View style={[styles.assistantRow, isLoading ? styles.assistantRowLoading : undefined]}>
        <View style={styles.assistantContent}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
              <Text style={styles.loadingText}>Aan het nadenken</Text>
            </View>
          ) : (
            <>
              <View style={styles.bubble}>
                <View style={styles.formattedLines}>
                  {lines.map((line, lineIndex) => {
                    if (line.kind === 'empty') return <View key={`line-${lineIndex}`} style={styles.emptyLine} />
                    if (line.kind === 'divider') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.dividerRow}>
                          <View style={styles.dividerLine} />
                        </View>
                      )
                    }
                    if (line.kind === 'headingTwo' || line.kind === 'headingThree') {
                      return (
                        <View key={`line-${lineIndex}`}>
                          {renderInlineSegments({
                            segments: line.segments,
                            textStyle: styles.headerText,
                            boldStyle: styles.headerTextBold,
                            onTranscriptMentionPress,
                          })}
                        </View>
                      )
                    }
                    if (line.kind === 'bullet') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <View style={styles.bulletText}>
                            {renderInlineSegments({ segments: line.segments, textStyle: styles.messageText, onTranscriptMentionPress })}
                          </View>
                        </View>
                      )
                    }
                    if (line.kind === 'numbered') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          <Text style={styles.numberedPrefix}>{`${line.number}.`}</Text>
                          <View style={styles.bulletText}>
                            {renderInlineSegments({ segments: line.segments, textStyle: styles.messageText, onTranscriptMentionPress })}
                          </View>
                        </View>
                      )
                    }
                    if (line.kind === 'quote') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.quoteRow}>
                          {renderInlineSegments({
                            segments: line.segments,
                            textStyle: styles.quoteText,
                            onTranscriptMentionPress,
                          })}
                        </View>
                      )
                    }
                    return (
                      <View key={`line-${lineIndex}`}>
                        {renderInlineSegments({
                          segments: line.segments,
                          textStyle: styles.messageText,
                          onTranscriptMentionPress,
                        })}
                      </View>
                    )
                  })}
                </View>
              </View>

              <View style={styles.messageActionsRow}>
                <Pressable
                  onPress={() => {
                    if (typeof navigator === 'undefined') return
                    navigator.clipboard?.writeText(String(displayText || '')).then(() => {
                      setShowCopyNotification(true)
                      setTimeout(() => setShowCopyNotification(false), 3000)
                    })
                  }}
                  style={({ hovered }) => [styles.actionButton, hovered ? styles.actionButtonHovered : undefined]}
                >
                  {showCopyNotification ? <CopiedIcon size={18} /> : <CopyIcon color="#8E8480" size={18} />}
                </Pressable>

                {isExportable ? (
                  <Pressable
                    onPress={() => {
                      const nextText = exportableText ?? displayText
                      if (onRequestPdfEdit) {
                        onRequestPdfEdit({ text: nextText, title: exportTitle, practiceSettings: pdfPracticeSettings })
                        return
                      }
                      void exportMessageToPdf(nextText, exportTitle, pdfPracticeSettings)
                    }}
                    style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHovered : undefined]}
                  >
                    <Text isSemibold style={styles.exportButtonText}>
                      Exporteer als PDF
                    </Text>
                    <SharePdfIcon color={colors.textSecondary} size={18} />
                  </Pressable>
                ) : null}
              </View>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <MessageText text={text} textStyle={styles.userText} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  assistantRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-start' },
  assistantRowLoading: { alignItems: 'center' },
  assistantContent: { flex: 1 },
  bubble: { backgroundColor: colors.assistantBubble, borderRadius: 12, padding: 16, gap: 12 },
  exportButton: { height: 32, borderRadius: 8, padding: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  exportButtonHovered: { backgroundColor: colors.hoverBackground },
  exportButtonText: { fontSize: 12, lineHeight: 16, color: colors.textSecondary },
  formattedLines: { gap: 8 },
  headerText: { fontSize: 16, lineHeight: 22, color: colors.text },
  headerTextBold: { fontSize: 16, lineHeight: 22, color: colors.text },
  italicText: { fontStyle: 'italic' },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.text, marginTop: 7 },
  bulletText: { flex: 1 },
  numberedPrefix: { fontSize: 14, lineHeight: 20, color: colors.text, minWidth: 20 },
  quoteRow: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: 10 },
  quoteText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  dividerRow: { width: '100%', paddingVertical: 6 },
  dividerLine: { width: '100%', height: 1, backgroundColor: colors.border },
  emptyLine: { height: 8 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
  messageText: { fontSize: 14, lineHeight: 20, color: colors.text },
  messageActionsRow: { marginTop: 8, flexDirection: 'row', alignItems: 'center', marginLeft: 12, gap: 8 },
  actionButton: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionButtonHovered: { backgroundColor: colors.hoverBackground },
  copyNotification: { alignItems: 'center' },
  copyNotificationText: { fontSize: 12, lineHeight: 16, color: colors.selected, textAlign: 'center' },
  userRow: { width: '100%', flexDirection: 'row', justifyContent: 'flex-end' },
  userBubble: { maxWidth: 520, backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12 },
  userText: { fontSize: 14, lineHeight: 20, color: colors.text },
  transcriptMention: {
    textDecorationLine: 'underline',
    color: colors.text,
    ...( { cursor: 'pointer' } as any ),
  },
  transcriptMentionHovered: {
    color: colors.selected,
  },
})

