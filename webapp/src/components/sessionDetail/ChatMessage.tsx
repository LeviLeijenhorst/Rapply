import React, { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'

import { FormattedText } from '../FormattedText'
import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { CopyIcon } from '../icons/CopyIcon'
import { SharePdfIcon } from '../icons/SharePdfIcon'

type Props = {
  role: 'user' | 'assistant'
  text: string
  isLoading?: boolean
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
  return String(text || '')
    .replace(pdfStartToken, '')
    .replace(pdfEndToken, '')
    .trim()
}

type DocumentSegment = {
  text: string
  isBold: boolean
}

type DocumentLine = {
  kind: 'header' | 'bullet' | 'divider' | 'text' | 'empty'
  segments: DocumentSegment[]
}

function splitBoldSegments(text: string, forceBold = false): DocumentSegment[] {
  const rawText = String(text || '')
  if (forceBold) {
    return [{ text: rawText.replace(/\*\*/g, ''), isBold: true }]
  }
  const parts = rawText.split('**')
  return parts.map((part, index) => ({
    text: part,
    isBold: index % 2 === 1,
  }))
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
    if (!token.text.trim() && currentLine.length === 0) {
      return
    }
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

  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

function buildDocumentLines(messageText: string): DocumentLine[] {
  const rawLines = String(messageText || '').replace(/\r/g, '').split('\n')
  return rawLines.map((line) => {
    const parsed = parseChatLine(line)
    if (parsed.kind === 'header') {
      return { kind: parsed.kind, segments: splitBoldSegments(parsed.text, true) }
    }
    if (parsed.kind === 'bullet') {
      return { kind: parsed.kind, segments: splitBoldSegments(parsed.text) }
    }
    if (parsed.kind === 'text') {
      return { kind: parsed.kind, segments: splitBoldSegments(parsed.text) }
    }
    return { kind: parsed.kind, segments: [] }
  })
}

async function exportMessageToPdf(messageText: string) {
  if (typeof window === 'undefined') return
  const { default: jsPDF } = await import('jspdf')
  const document = new jsPDF()
  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 8
  const bulletLineHeight = 8
  const headerFontSize = 13
  const textFontSize = 11
  const titleFontSize = 18
  const metaFontSize = 10
  const bulletIndent = 12
  let cursorY = margin

  const documentLines = buildDocumentLines(messageText)
  const generatedLabel = `Gegenereerd op ${new Date().toLocaleString('nl-NL')}`

  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight <= pageHeight - margin) return
    document.addPage()
    cursorY = margin
  }

  document.setTextColor(38, 52, 63)
  ensureSpace(titleFontSize + lineHeight)
  document.setFont('Helvetica', 'bold')
  document.setFontSize(titleFontSize)
  document.text('Coachscribe export', margin, cursorY)
  cursorY += titleFontSize
  document.setFont('Helvetica', 'normal')
  document.setFontSize(metaFontSize)
  document.setTextColor(110, 120, 128)
  document.text(generatedLabel, margin, cursorY)
  cursorY += lineHeight
  document.setDrawColor(224, 224, 224)
  document.setLineWidth(0.6)
  document.line(margin, cursorY, pageWidth - margin, cursorY)
  cursorY += lineHeight
  document.setTextColor(38, 52, 63)

  documentLines.forEach((line) => {
    if (line.kind === 'empty') {
      ensureSpace(lineHeight)
      cursorY += lineHeight
      return
    }

    if (line.kind === 'divider') {
      ensureSpace(lineHeight)
      const lineY = cursorY + lineHeight / 2
      document.setDrawColor(210, 210, 210)
      document.setLineWidth(0.4)
      document.line(margin, lineY, pageWidth - margin, lineY)
      cursorY += lineHeight
      return
    }

    if (line.kind === 'header') {
      const wrapped = wrapSegmentsToLines(document, line.segments, maxWidth, headerFontSize)
      wrapped.forEach((segments) => {
        ensureSpace(lineHeight)
        let cursorX = margin
        segments.forEach((segment) => {
          document.setFont('Helvetica', segment.isBold ? 'bold' : 'normal')
          document.setFontSize(headerFontSize)
          document.text(segment.text, cursorX, cursorY)
          cursorX += document.getTextWidth(segment.text)
        })
        cursorY += lineHeight
      })
      return
    }

    if (line.kind === 'bullet') {
      const bulletSymbol = '•'
      document.setFont('Helvetica', 'normal')
      document.setFontSize(textFontSize)
      const bulletWidth = document.getTextWidth(`${bulletSymbol} `)
      const availableWidth = maxWidth - bulletIndent
      const wrapped = wrapSegmentsToLines(document, line.segments, availableWidth, textFontSize)
      wrapped.forEach((segments, index) => {
        ensureSpace(bulletLineHeight)
        if (index === 0) {
          document.setFont('Helvetica', 'normal')
          document.setFontSize(textFontSize)
          document.text(bulletSymbol, margin, cursorY)
          let cursorX = margin + bulletWidth
          segments.forEach((segment) => {
            document.setFont('Helvetica', segment.isBold ? 'bold' : 'normal')
            document.setFontSize(textFontSize)
            document.text(segment.text, cursorX, cursorY)
            cursorX += document.getTextWidth(segment.text)
          })
        } else {
          let cursorX = margin + bulletIndent
          segments.forEach((segment) => {
            document.setFont('Helvetica', segment.isBold ? 'bold' : 'normal')
            document.setFontSize(textFontSize)
            document.text(segment.text, cursorX, cursorY)
            cursorX += document.getTextWidth(segment.text)
          })
        }
        cursorY += bulletLineHeight
      })
      return
    }

    const wrapped = wrapSegmentsToLines(document, line.segments, maxWidth, textFontSize)
    wrapped.forEach((segments) => {
      ensureSpace(lineHeight)
      let cursorX = margin
      segments.forEach((segment) => {
        document.setFont('Helvetica', segment.isBold ? 'bold' : 'normal')
        document.setFontSize(textFontSize)
        document.text(segment.text, cursorX, cursorY)
        cursorX += document.getTextWidth(segment.text)
      })
      cursorY += lineHeight
    })
  })
  document.save('antwoord.pdf')
}

function parseChatLine(line: string): ChatLine {
  const trimmedLine = line.trim()
  if (!trimmedLine) return { kind: 'empty', text: '' }
  if (trimmedLine === '---') {
    return { kind: 'divider', text: '' }
  }
  if (trimmedLine.startsWith('####') || trimmedLine.startsWith('###')) {
    return { kind: 'header', text: trimmedLine.replace(/^#{3,4}\s*/, '').trim() }
  }
  if (trimmedLine.startsWith('- ')) {
    return { kind: 'bullet', text: trimmedLine.replace('- ', '').trim() }
  }
  return { kind: 'text', text: line }
}

export function ChatMessage({ role, text, isLoading }: Props) {
  const isAssistant = role === 'assistant'
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const exportableText = extractExportableText(text)
  const displayText = removeExportMarkers(text)
  const lines = String(displayText || '').split('\n').map(parseChatLine)
  const isExportable = isAssistant && Boolean(exportableText)

  if (isAssistant) {
    return (
      <View style={[styles.assistantRow, isLoading ? styles.assistantRowLoading : undefined]}>
        {/* Assistant message */}
        <View style={styles.assistantContent}>
          {isLoading ? (
            <View style={styles.loadingRow}>
              {/* Loading indicator */}
              <ActivityIndicator size="small" color={colors.selected} />
              <Text style={styles.loadingText}>Aan het nadenken</Text>
            </View>
          ) : (
            <>
              <View style={styles.bubble}>
                {/* Assistant message bubble */}
                {isExportable ? (
                  <View style={styles.exportRow}>
                    {/* Export to pdf */}
                    <Pressable
                      onPress={() => exportMessageToPdf(exportableText ?? displayText)}
                      style={({ hovered }) => [styles.exportButton, hovered ? styles.exportButtonHovered : undefined]}
                    >
                      <Text isSemibold style={styles.exportButtonText}>
                        Download als PDF
                      </Text>
                      <SharePdfIcon color={colors.textSecondary} size={18} />
                    </Pressable>
                  </View>
                ) : null}
                <View style={styles.formattedLines}>
                  {/* Assistant message content */}
                  {lines.map((line, lineIndex) => {
                    if (line.kind === 'empty') {
                      return <View key={`line-${lineIndex}`} style={styles.emptyLine} />
                    }

                    if (line.kind === 'divider') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.dividerRow}>
                          {/* Divider */}
                          <View style={styles.dividerLine} />
                        </View>
                      )
                    }

                    if (line.kind === 'header') {
                      return (
                        <FormattedText key={`line-${lineIndex}`} text={line.text} textStyle={styles.headerText} boldStyle={styles.headerTextBold} />
                      )
                    }

                    if (line.kind === 'bullet') {
                      return (
                        <View key={`line-${lineIndex}`} style={styles.bulletRow}>
                          {/* Bullet */}
                          <View style={styles.bulletDot} />
                          {/* Bullet text */}
                          <View style={styles.bulletText}>
                            <FormattedText text={line.text} textStyle={styles.messageText} />
                          </View>
                        </View>
                      )
                    }

                    return <FormattedText key={`line-${lineIndex}`} text={line.text} textStyle={styles.messageText} />
                  })}
                </View>
              </View>

              <View style={styles.messageActionsRow}>
                {/* Assistant message actions */}
                <View style={styles.actionStack}>
                  <Pressable
                    onPress={() => {
                      if (typeof navigator === 'undefined') return
                      navigator.clipboard?.writeText(String(displayText || '')).then(() => {
                        setShowCopyNotification(true)
                        setTimeout(() => setShowCopyNotification(false), 2000)
                      })
                    }}
                    style={({ hovered }) => [styles.actionButton, hovered ? styles.actionButtonHovered : undefined]}
                  >
                    <CopyIcon color="#8E8480" size={18} />
                  </Pressable>
                  {showCopyNotification ? (
                    <View style={styles.copyNotification}>
                      <Text style={styles.copyNotificationText}>Gekopieerd</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </>
          )}
        </View>
      </View>
    )
  }

  return (
    <View style={styles.userRow}>
      {/* User message */}
      <View style={styles.userBubble}>
        <FormattedText text={text} textStyle={styles.userText} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  assistantRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assistantRowLoading: {
    alignItems: 'center',
  },
  assistantContent: {
    flex: 1,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  exportRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  exportButton: {
    height: 28,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  exportButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  exportButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  formattedLines: {
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  headerTextBold: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.text,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
  },
  dividerRow: {
    width: '100%',
    paddingVertical: 6,
  },
  dividerLine: {
    width: '100%',
    height: 1,
    backgroundColor: colors.border,
  },
  emptyLine: {
    height: 8,
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
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  messageActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionStack: {
    alignItems: 'center',
    gap: 4,
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
  copyNotification: {
    alignItems: 'center',
  },
  copyNotificationText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.selected,
    textAlign: 'center',
  },
  userRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  userText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
})

