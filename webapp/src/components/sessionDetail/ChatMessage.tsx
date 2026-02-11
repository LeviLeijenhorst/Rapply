import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { CopyIcon } from '../icons/CopyIcon'
import { CopiedIcon } from '../icons/CopiedIcon'
import { SharePdfIcon } from '../icons/SharePdfIcon'
import { parseTimeLabelToSeconds } from '../../utils/time'
import { useLocalAppData } from '../../local/LocalAppDataProvider'

type Props = {
  role: 'user' | 'assistant'
  text: string
  isLoading?: boolean
  onTranscriptMentionPress?: (seconds: number) => void
  exportTitle?: string
}

type ChatLine = {
  kind: 'header' | 'bullet' | 'divider' | 'text' | 'empty'
  text: string
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
  kind: 'header' | 'bullet' | 'divider' | 'text' | 'empty'
  segments: DocumentSegment[]
}

type PdfPracticeSettings = {
  practiceName: string
  website: string
  tintColor: string
  logoDataUrl: string | null
}

function parseHexColorToRgb(value: string, fallback: { r: number; g: number; b: number }) {
  const text = String(value || '').trim()
  const match = text.match(/^#([0-9a-fA-F]{6})$/)
  if (!match) return fallback
  const hex = match[1]
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  }
}

function buildMentionTokens(text: string): MentionToken[] {
  const tokens: MentionToken[] = []
  const mentionPattern = /\[\[timestamp=([0-9:.]+)\|([^\]]+)\]\]/g
  let lastIndex = 0
  let match = mentionPattern.exec(text)
  while (match) {
    const start = match.index
    if (start > lastIndex) {
      tokens.push({ kind: 'text', text: text.slice(lastIndex, start) })
    }
    tokens.push({ kind: 'mention', text: match[2], timeLabel: match[1] })
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
  const rawLines = String(messageText || '').replace(/\r/g, '').split('\n')
  return rawLines.map((line) => {
    const parsed = parseChatLine(line)
    if (parsed.kind === 'header') return { kind: parsed.kind, segments: splitBoldSegments(parsed.text, true) }
    if (parsed.kind === 'bullet') return { kind: parsed.kind, segments: splitBoldSegments(parsed.text) }
    if (parsed.kind === 'text') return { kind: parsed.kind, segments: splitBoldSegments(parsed.text) }
    return { kind: parsed.kind, segments: [] }
  })
}

function guessTitleFromLines(lines: DocumentLine[]) {
  const firstHeader = lines.find((l) => l.kind === 'header')
  const raw = firstHeader?.segments.map((s) => s.text).join('')?.trim()
  return raw || 'CoachScribe export'
}

function addFooters(
  document: any,
  footerLineY: number,
  marginLeft: number,
  marginRight: number,
  footerFontSize: number,
  brandColor: { r: number; g: number; b: number },
  websiteLabel: string,
  practiceName: string,
) {
  const pageCount = document.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    document.setPage(i)
    const pageWidth = document.internal.pageSize.getWidth()
    const pageHeight = document.internal.pageSize.getHeight()
    document.setDrawColor(brandColor.r, brandColor.g, brandColor.b)
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
    if (practiceName) {
      document.text(practiceName, marginLeft, pageHeight - 12)
    }
  }
}

function buildPdfFileName(title: string) {
  const rawTitle = String(title || '').trim() || 'Verslag'
  const safeTitle = rawTitle.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
  return `${safeTitle || 'Verslag'}.pdf`
}

function getFittedTitleFontSize(document: any, title: string, maxWidth: number, baseSize: number, minSize: number) {
  document.setFont('Helvetica', 'bold')
  document.setFontSize(baseSize)
  const width = document.getTextWidth(title)
  if (width <= maxWidth) return baseSize
  const scale = maxWidth / width
  return Math.max(minSize, Math.floor(baseSize * scale))
}

async function convertSvgToPngDataUrl(svgText: string, width: number, height: number, scale = 1) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return null
  return new Promise<string | null>((resolve) => {
    const image = new Image()
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(width * scale))
      canvas.height = Math.max(1, Math.round(height * scale))
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        resolve(null)
        return
      }
      context.setTransform(scale, 0, 0, scale, 0, 0)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.clearRect(0, 0, width, height)
      context.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/png'))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    image.src = url
  })
}

async function exportMessageToPdf(messageText: string, reportTitle: string | undefined, practiceSettings: PdfPracticeSettings) {
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
  const subtitleFontSize = 18
  const dateFontSize = 10
  const footerFontSize = 9

  const brandColor = parseHexColorToRgb(practiceSettings.tintColor, { r: 190, g: 1, b: 101 })
  const textColor = { r: 38, g: 52, b: 63 }
  const strongTextColor = { r: 29, g: 10, b: 0 }
  const dateTextColor = { r: 115, g: 125, b: 134 }

  let cursorY = marginTop

  const lines = buildDocumentLines(messageText)
  const title = String(reportTitle || '').trim() || 'Titel van het verslag'
  const dateLabel = new Date().toLocaleDateString('nl-NL', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/')
  const bodyLines = lines

  const logoSvg = `
      <svg width="159" height="24" viewBox="0 0 159 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="coachscribe_mark_gradient" x1="1.49953" y1="22.8828" x2="22.7342" y2="0.260399" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7E0056"/>
            <stop offset="1" stop-color="#F20070"/>
          </linearGradient>
          <linearGradient id="coachscribe_wordmark_gradient" x1="0" y1="19" x2="125" y2="0" gradientUnits="userSpaceOnUse">
            <stop stop-color="#7E0056"/>
            <stop offset="1" stop-color="#F20070"/>
          </linearGradient>
        </defs>
        <path d="M2.67547 19.4592L0.000227125 23.8646L2.83616 22.7766L5.27208 19.7079L9.04198 19.4619L10.9367 16.3451L10.5904 13.4942L13.6192 13.1263L16.4944 9.71114L15.8944 6.74018L19.3197 6.04845L23.7022 0.0097814C15.9051 -0.182568 11.2231 2.39305 2.0648 13.9136L2.67547 19.4592Z" fill="url(#coachscribe_mark_gradient)"/>
        <text x="34" y="15" font-size="20" font-family="Arial, sans-serif" font-weight="700" fill="#1D0A00">Coach<tspan fill="url(#coachscribe_wordmark_gradient)">Scribe</tspan></text>
      </svg>
    `
  const generatedLogoDataUrl = await convertSvgToPngDataUrl(logoSvg, 159, 24, 4)
  const logoDataUrl = practiceSettings.logoDataUrl || generatedLogoDataUrl

  const ensureSpace = (needed: number) => {
    if (cursorY + needed <= footerLineY - 12) return
    doc.addPage()
    cursorY = marginTop
    drawPageHeader()
  }

  const drawLogo = () => {
    if (!logoDataUrl) return
    const maxLogoWidth = 110
    const maxLogoHeight = 24
    let logoWidth = maxLogoWidth
    let logoHeight = (logoWidth * 24) / 159
    try {
      const imageProps = doc.getImageProperties(logoDataUrl)
      const sourceWidth = Number(imageProps?.width || 0)
      const sourceHeight = Number(imageProps?.height || 0)
      if (sourceWidth > 0 && sourceHeight > 0) {
        const scale = Math.min(maxLogoWidth / sourceWidth, maxLogoHeight / sourceHeight)
        logoWidth = sourceWidth * scale
        logoHeight = sourceHeight * scale
      }
    } catch {
      // Keep fallback dimensions.
    }
    const logoX = pageWidth - marginRight - logoWidth
    const logoY = marginTop
    const format = logoDataUrl.includes('image/jpeg') || logoDataUrl.includes('image/jpg') ? 'JPEG' : 'PNG'
    doc.addImage(logoDataUrl, format, logoX, logoY, logoWidth, logoHeight)
  }

  const drawPageHeader = () => {
    drawLogo()
    const titleMaxWidth = Math.max(160, maxWidth - 210)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(subtitleFontSize)
    doc.setTextColor(brandColor.r, brandColor.g, brandColor.b)
    const wrappedTitle = doc.splitTextToSize(title, titleMaxWidth)
    wrappedTitle.forEach((titleLine: string) => {
      doc.text(titleLine, contentX, cursorY)
      cursorY += subtitleFontSize + 2
    })
    cursorY += 2
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(dateFontSize)
    doc.setTextColor(dateTextColor.r, dateTextColor.g, dateTextColor.b)
    doc.text(dateLabel, contentX, cursorY)
    cursorY += 12
    doc.setDrawColor(brandColor.r, brandColor.g, brandColor.b)
    doc.setLineWidth(1)
    doc.line(contentX, cursorY, pageWidth - marginRight, cursorY)
    cursorY += 22
  }

  drawPageHeader()

  bodyLines.forEach((line) => {
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

    if (line.kind === 'header') {
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
    brandColor,
    String(practiceSettings.website || '').trim(),
    String(practiceSettings.practiceName || '').trim(),
  )
  doc.save(buildPdfFileName(title))
}

function parseChatLine(line: string): ChatLine {
  const trimmedLine = line.trim()
  if (!trimmedLine) return { kind: 'empty', text: '' }
  if (trimmedLine === '---') return { kind: 'divider', text: '' }
  if (trimmedLine.startsWith('####') || trimmedLine.startsWith('###')) {
    return { kind: 'header', text: trimmedLine.replace(/^#{3,4}\s*/, '').trim() }
  }
  if (trimmedLine.startsWith('- ')) return { kind: 'bullet', text: trimmedLine.replace('- ', '').trim() }
  if (trimmedLine.startsWith('• ')) return { kind: 'bullet', text: trimmedLine.replace('• ', '').trim() }
  return { kind: 'text', text: line }
}

export function ChatMessage({ role, text, isLoading, onTranscriptMentionPress, exportTitle }: Props) {
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
  const lines = String(displayText || '').split('\n').map(parseChatLine)
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
                    if (line.kind === 'header') {
                      return (
                        <MessageText
                          key={`line-${lineIndex}`}
                          text={line.text}
                          textStyle={styles.headerText}
                          boldStyle={styles.headerTextBold}
                          onTranscriptMentionPress={onTranscriptMentionPress}
                        />
                      )
                    }
                    if (line.kind === 'bullet') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          <View style={styles.bulletDot} />
                          <View style={styles.bulletText}>
                            <MessageText text={line.text} textStyle={styles.messageText} onTranscriptMentionPress={onTranscriptMentionPress} />
                          </View>
                        </View>
                      )
                    }
                    return <MessageText key={`line-${lineIndex}`} text={line.text} textStyle={styles.messageText} onTranscriptMentionPress={onTranscriptMentionPress} />
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
                    onPress={() => exportMessageToPdf(exportableText ?? displayText, exportTitle, pdfPracticeSettings)}
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
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: colors.text, marginTop: 7 },
  bulletText: { flex: 1 },
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
