import React from 'react'

import { Text } from '../ui/Text'
import { colors } from '../design/theme/colors'

type Props = {
  text: string
  textStyle?: any
  boldStyle?: any
  onPressTimeRangeStartSeconds?: (seconds: number) => void
}

function parseClockToSeconds(value: string): number | null {
  const cleaned = String(value || '').trim()
  if (!cleaned) return null
  const parts = cleaned.split(':')
  if (parts.length !== 2 && parts.length !== 3) return null

  const hours = parts.length === 3 ? Number(parts[0]) : 0
  const minutes = parts.length === 3 ? Number(parts[1]) : Number(parts[0])
  const seconds = parts.length === 3 ? Number(parts[2]) : Number(parts[1])

  if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null
  return hours * 3600 + minutes * 60 + seconds
}

type Segment = {
  key: string
  text: string
  isBold: boolean
  timeRangeStartSeconds: number | null
}

function buildSegments(text: string): Segment[] {
  const rawText = String(text || '')
  const boldParts = rawText.split('**')
  const segments: Segment[] = []

  const timeRangeRegex = /\((\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)\)/g

  boldParts.forEach((part, boldIndex) => {
    const isBold = boldIndex % 2 === 1
    let cursor = 0
    let match: RegExpExecArray | null = null
    while ((match = timeRangeRegex.exec(part)) !== null) {
      const before = part.slice(cursor, match.index)
      if (before) {
        segments.push({ key: `t-${boldIndex}-${cursor}`, text: before, isBold, timeRangeStartSeconds: null })
      }

      const timeRangeText = match[0]
      const startSeconds = parseClockToSeconds(match[1])
      segments.push({
        key: `r-${boldIndex}-${match.index}`,
        text: timeRangeText,
        isBold,
        timeRangeStartSeconds: startSeconds,
      })

      cursor = match.index + timeRangeText.length
    }

    const after = part.slice(cursor)
    if (after) {
      segments.push({ key: `a-${boldIndex}-${cursor}`, text: after, isBold, timeRangeStartSeconds: null })
    }
  })

  if (segments.length === 0) {
    return [{ key: 'plain', text: rawText.replace(/\*\*/g, ''), isBold: false, timeRangeStartSeconds: null }]
  }

  return segments
}

export function InteractiveFormattedText({ text, textStyle, boldStyle, onPressTimeRangeStartSeconds }: Props) {
  const segments = buildSegments(text)
  return (
    <Text style={textStyle}>
      {/* Interactive formatted text */}
      {segments.map((segment) => {
        const isTimeRange = segment.timeRangeStartSeconds !== null && !!onPressTimeRangeStartSeconds
        const onPress = isTimeRange ? () => onPressTimeRangeStartSeconds(segment.timeRangeStartSeconds as number) : undefined
        return (
          <Text
            key={segment.key}
            isBold={segment.isBold}
            onPress={onPress}
            style={[
              segment.isBold ? boldStyle : undefined,
              isTimeRange ? styles.timeRange : undefined,
              isTimeRange ? ({ cursor: 'pointer' } as any) : undefined,
            ]}
          >
            {segment.text}
          </Text>
        )
      })}
    </Text>
  )
}

const styles = {
  timeRange: {
    textDecorationLine: 'underline',
    color: colors.selected,
  },
} as const


