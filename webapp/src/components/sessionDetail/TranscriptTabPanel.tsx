import React, { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { FormattedText } from '../FormattedText'
import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { SearchIcon } from '../icons/SearchIcon'
import { parseTimeLabelToSeconds } from '../../utils/time'
import { toUserFriendlyTranscriptionError } from '../../utils/transcriptionError'
import { useToast } from '../../toast/ToastProvider'

type Props = {
  searchValue: string
  onChangeSearchValue: (value: string) => void
  shouldFillAvailableHeight?: boolean
  transcript: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onSeekToSeconds?: (seconds: number) => void
  onRetryTranscription?: () => void
  onCancelGeneration?: () => void
  currentAudioSeconds?: number
  highlightTintColor?: string
  useTintColors?: boolean
  audioDurationSeconds?: number | null
}

type ParsedTranscriptLine = {
  id: string
  speakerKey: string
  messageText: string
  timeSeconds: number | null
  resolvedTimeSeconds: number | null
}

function parseTranscriptLine(line: string, index: number): ParsedTranscriptLine {
  const leadingTimeMatch = line.match(/^\s*\[?\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)\s*\]?\s*/)
  const inlineTimeMatch = leadingTimeMatch ? null : line.match(/(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)/)
  const timeLabel = leadingTimeMatch?.[1] ?? inlineTimeMatch?.[1] ?? null
  const timeSeconds = timeLabel ? parseTimeLabelToSeconds(timeLabel) : null
  let lineWithoutTime = line.trim()
  if (leadingTimeMatch) {
    lineWithoutTime = line.slice(leadingTimeMatch[0].length).trim()
  } else if (inlineTimeMatch && inlineTimeMatch.index !== undefined) {
    const withoutInlineTime = `${line.slice(0, inlineTimeMatch.index)} ${line.slice(inlineTimeMatch.index + inlineTimeMatch[1].length)}`
    lineWithoutTime = withoutInlineTime.replace(/\s{2,}/g, ' ').trim()
  }
  const speakerSeparatorIndex = lineWithoutTime.indexOf(':')
  const speakerLabel = speakerSeparatorIndex >= 0 ? lineWithoutTime.slice(0, speakerSeparatorIndex).trim() : ''
  const messageText = speakerSeparatorIndex >= 0 ? lineWithoutTime.slice(speakerSeparatorIndex + 1).trim() : lineWithoutTime
  return {
    id: `${index}-${line}`,
    speakerKey: speakerLabel.toLowerCase(),
    messageText,
    timeSeconds,
    resolvedTimeSeconds: null,
  }
}

function resolveTranscriptLineTimes(lines: ParsedTranscriptLine[], normalizedAudioDurationSeconds: number | null): ParsedTranscriptLine[] {
  if (lines.length === 0) return []
  const indexedTimeAnchors = lines
    .map((line, index) => ({ index, timeSeconds: line.timeSeconds }))
    .filter((item): item is { index: number; timeSeconds: number } => Number.isFinite(item.timeSeconds))

  if (indexedTimeAnchors.length === 0) {
    if (normalizedAudioDurationSeconds === null) return lines
    if (lines.length === 1) return [{ ...lines[0], resolvedTimeSeconds: 0 }]
    return lines.map((line, index) => ({
      ...line,
      resolvedTimeSeconds: (index / (lines.length - 1)) * normalizedAudioDurationSeconds,
    }))
  }

  const fallbackPerLineSeconds =
    normalizedAudioDurationSeconds !== null && lines.length > 1
      ? normalizedAudioDurationSeconds / (lines.length - 1)
      : 1

  const resolved: ParsedTranscriptLine[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const ownTime = line.timeSeconds
    let resolvedTimeSeconds = ownTime

    if (resolvedTimeSeconds === null) {
      const previousAnchor = [...indexedTimeAnchors].reverse().find((anchor) => anchor.index < index) ?? null
      const nextAnchor = indexedTimeAnchors.find((anchor) => anchor.index > index) ?? null

      if (previousAnchor && nextAnchor) {
        const span = nextAnchor.index - previousAnchor.index
        const progress = span > 0 ? (index - previousAnchor.index) / span : 0
        resolvedTimeSeconds = previousAnchor.timeSeconds + (nextAnchor.timeSeconds - previousAnchor.timeSeconds) * progress
      } else if (previousAnchor && normalizedAudioDurationSeconds !== null && lines.length > 1) {
        const remainingLineCount = lines.length - 1 - previousAnchor.index
        const remainingDuration = Math.max(0, normalizedAudioDurationSeconds - previousAnchor.timeSeconds)
        const perLine = remainingLineCount > 0 ? remainingDuration / remainingLineCount : 0
        resolvedTimeSeconds = previousAnchor.timeSeconds + perLine * (index - previousAnchor.index)
      } else if (nextAnchor) {
        const startTime = 0
        const span = nextAnchor.index
        const progress = span > 0 ? index / span : 0
        resolvedTimeSeconds = startTime + (nextAnchor.timeSeconds - startTime) * progress
      } else if (previousAnchor) {
        resolvedTimeSeconds = previousAnchor.timeSeconds + (index - previousAnchor.index) * fallbackPerLineSeconds
      }
    }

    if (resolvedTimeSeconds === null) {
      resolved.push(line)
      continue
    }
    const previousResolved = index > 0 ? resolved[index - 1].resolvedTimeSeconds : null
    const minAllowed = Number.isFinite(previousResolved) ? (previousResolved as number) + 0.001 : 0
    resolved.push({ ...line, resolvedTimeSeconds: Math.max(minAllowed, resolvedTimeSeconds) })
  }

  return resolved.map((line, index, resolvedLines) => {
    if (line.resolvedTimeSeconds === null) return line
    const maxDuration = normalizedAudioDurationSeconds
    if (maxDuration === null) return line
    if (index === resolvedLines.length - 1) return { ...line, resolvedTimeSeconds: Math.min(line.resolvedTimeSeconds, maxDuration) }
    return { ...line, resolvedTimeSeconds: Math.min(line.resolvedTimeSeconds, maxDuration) }
  })
}

const INITIAL_VISIBLE_LINE_COUNT = 140
const VISIBLE_LINE_CHUNK_SIZE = 140

export function TranscriptTabPanel({
  searchValue,
  onChangeSearchValue,
  shouldFillAvailableHeight = true,
  transcript,
  transcriptionStatus,
  transcriptionError,
  onSeekToSeconds,
  onRetryTranscription,
  onCancelGeneration,
  currentAudioSeconds,
  highlightTintColor,
  useTintColors = true,
  audioDurationSeconds,
}: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const [visibleLineCount, setVisibleLineCount] = useState(INITIAL_VISIBLE_LINE_COUNT)
  const { showErrorToast } = useToast()

  const hasTranscript = Boolean(transcript && transcript.trim())
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const isLoading = isTranscribing || (isGenerating && !hasTranscript)
  const hasError = transcriptionStatus === 'error'
  const hasContent = hasTranscript && !isLoading && !hasError
  const transcriptErrorMessage = toUserFriendlyTranscriptionError(transcriptionError, 'Er is een fout opgetreden bij het genereren van de transcriptie.')
  const isInsufficientMinutesError = transcriptErrorMessage.toLowerCase().includes('niet genoeg minuten over voor transcriptie')

  const filteredTranscript =
    transcript && searchValue.trim() ? transcript.split('\n').filter((line) => line.toLowerCase().includes(searchValue.trim().toLowerCase())) : transcript?.split('\n') || []

  const parsedTranscriptLines = filteredTranscript.map((line, index) => parseTranscriptLine(line, index))
  const normalizedAudioDurationSeconds = Number.isFinite(audioDurationSeconds) && Number(audioDurationSeconds) > 0 ? Number(audioDurationSeconds) : null
  const parsedTranscriptLinesWithResolvedTimes = useMemo(
    () => resolveTranscriptLineTimes(parsedTranscriptLines, normalizedAudioDurationSeconds),
    [parsedTranscriptLines, normalizedAudioDurationSeconds],
  )
  const firstSpeakerKey = parsedTranscriptLinesWithResolvedTimes.find((line) => line.speakerKey)?.speakerKey ?? ''
  const hasSearch = searchValue.trim().length > 0
  const shouldShowSpeakerSplitColors = useTintColors && normalizedAudioDurationSeconds !== null
  const activeLineBorderColor = useTintColors && highlightTintColor ? highlightTintColor : colors.border
  const activeLineBackgroundColor = useTintColors && highlightTintColor ? `${highlightTintColor}22` : colors.hoverBackground

  useEffect(() => {
    setVisibleLineCount(INITIAL_VISIBLE_LINE_COUNT)
  }, [transcript, searchValue])

  useEffect(() => {
    if (!hasError) return
    if (isInsufficientMinutesError) return
    showErrorToast(transcriptErrorMessage, 'Er is een fout opgetreden bij het genereren van de transcriptie.')
  }, [hasError, isInsufficientMinutesError, showErrorToast, transcriptErrorMessage])

  const visibleTranscriptLines = useMemo(() => {
    if (hasSearch) return parsedTranscriptLinesWithResolvedTimes
    return parsedTranscriptLinesWithResolvedTimes.slice(0, visibleLineCount)
  }, [hasSearch, parsedTranscriptLinesWithResolvedTimes, visibleLineCount])

  const activeLineId = useMemo(() => {
    if (!Number.isFinite(currentAudioSeconds) || currentAudioSeconds === undefined) return null
    const timeline = parsedTranscriptLinesWithResolvedTimes
      .map((line, index) => ({
        id: line.id,
        timeSeconds: line.resolvedTimeSeconds,
      }))
      .filter((item): item is { id: string; timeSeconds: number } => item.timeSeconds !== null)

    for (let index = 0; index < timeline.length; index += 1) {
      const current = timeline[index]
      const next = timeline[index + 1]
      if (!next) {
        if (currentAudioSeconds >= current.timeSeconds) return current.id
        continue
      }
      if (currentAudioSeconds >= current.timeSeconds && currentAudioSeconds < next.timeSeconds) return current.id
    }
    return null
  }, [currentAudioSeconds, parsedTranscriptLinesWithResolvedTimes])

  return (
    <View style={[styles.container, shouldFillAvailableHeight ? styles.containerFill : styles.containerAuto]}>
      {/* Transcript tab content */}
      <View style={styles.searchInputContainer}>
        <SearchIcon color="#656565" size={18} />
        <TextInput
          value={searchValue}
          onChangeText={onChangeSearchValue}
          placeholder="Zoeken..."
          placeholderTextColor="#656565"
          style={[styles.searchInput, inputWebStyle]}
        />
      </View>

      <ScrollView
        style={[styles.list, shouldFillAvailableHeight ? styles.listFill : styles.listAuto]}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator
        onScroll={(event) => {
          if (hasSearch) return
          if (visibleLineCount >= parsedTranscriptLinesWithResolvedTimes.length) return
          const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent
          const distanceToBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height)
          if (distanceToBottom > 320) return
          setVisibleLineCount((previous) => Math.min(parsedTranscriptLinesWithResolvedTimes.length, previous + VISIBLE_LINE_CHUNK_SIZE))
        }}
        scrollEventThrottle={32}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {/* Loading message */}
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
              <Text style={styles.loadingText}>Transcript wordt gegenereerd</Text>
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
            {onRetryTranscription ? (
              <Pressable
                onPress={onRetryTranscription}
                style={({ hovered }) => [styles.retryButton, hovered ? styles.retryButtonHovered : undefined]}
              >
                {/* Retry transcription */}
                <Text isBold style={styles.retryButtonText}>
                  Opnieuw proberen
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : hasContent ? (
          parsedTranscriptLines.length > 0 ? (
            visibleTranscriptLines.map((line, index) => {
              const isFirstSpeaker = firstSpeakerKey ? line.speakerKey === firstSpeakerKey : true
              const absoluteIndex = parsedTranscriptLinesWithResolvedTimes.findIndex((item) => item.id === line.id)
              const resolvedLine = absoluteIndex >= 0 ? parsedTranscriptLinesWithResolvedTimes[absoluteIndex] : line
              const seekSeconds = resolvedLine.resolvedTimeSeconds
              const nextLineResolvedSeconds =
                absoluteIndex >= 0 ? parsedTranscriptLinesWithResolvedTimes[absoluteIndex + 1]?.resolvedTimeSeconds ?? null : null
              const isSeekEnabled = !!onSeekToSeconds && seekSeconds !== null
              const isActiveLine = activeLineId === line.id
              return (
                <Pressable
                  key={line.id}
                  onPress={
                    isSeekEnabled
                      ? () => {
                          const baseSeekSeconds = seekSeconds as number
                          const maxSeekSeconds =
                            nextLineResolvedSeconds !== null
                              ? Math.max(baseSeekSeconds, nextLineResolvedSeconds - 0.05)
                              : normalizedAudioDurationSeconds ?? baseSeekSeconds + 0.05
                          const seekTarget = Math.min(maxSeekSeconds, baseSeekSeconds + 0.05)
                          onSeekToSeconds?.(seekTarget)
                        }
                      : undefined
                  }
                  style={({ hovered }) => [
                    styles.row,
                    styles.messageRow,
                    shouldShowSpeakerSplitColors && isFirstSpeaker ? styles.messageRowPrimary : styles.messageRowSecondary,
                    isSeekEnabled ? styles.messageRowClickable : undefined,
                    isSeekEnabled && hovered ? styles.messageRowHovered : undefined,
                    isActiveLine
                      ? {
                          borderColor: activeLineBorderColor,
                          backgroundColor: activeLineBackgroundColor,
                        }
                      : undefined,
                  ]}
                >
                  {/* Transcript line */}
                  <View style={styles.messageBubble}>
                    <FormattedText text={line.messageText} textStyle={styles.text} />
                  </View>
                </Pressable>
              )
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Geen resultaten gevonden</Text>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Geen transcriptie beschikbaar</Text>
            {onRetryTranscription ? (
              <Pressable
                onPress={onRetryTranscription}
                style={({ hovered }) => [styles.retryButton, hovered ? styles.retryButtonHovered : undefined]}
              >
                <Text isBold style={styles.retryButtonText}>
                  Opnieuw proberen
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </ScrollView>
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
  containerAuto: {
    flexGrow: 0,
  },
  searchInputContainer: {
    width: '100%',
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  list: {
    width: '100%',
  },
  listFill: {
    flex: 1,
  },
  listAuto: {
    flexGrow: 0,
  },
  listContent: {
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  messageRow: {
    width: '100%',
  },
  messageRowPrimary: {
    backgroundColor: '#F7F2F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  messageRowSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  messageRowClickable: {
    ...( { cursor: 'pointer' } as any ),
  },
  messageRowHovered: {
    backgroundColor: colors.hoverBackground,
  },
  messageBubble: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  loadingContainer: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})

