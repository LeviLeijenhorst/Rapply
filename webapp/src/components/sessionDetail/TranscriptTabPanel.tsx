import React from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native'

import { FormattedText } from '../FormattedText'
import { Text } from '../Text'
import { colors } from '../../theme/colors'
import { SearchIcon } from '../icons/SearchIcon'
import { parseTimeLabelToSeconds } from '../../utils/time'

type TranscriptLine = {
  speakerName: string
  timeLabel: string
  text: string
}

const transcriptLines: TranscriptLine[] = [
  { speakerName: 'Levi', timeLabel: '00:01', text: 'De bedoeling is dat je zegmaar uhm het exacte gesprek woord voor woord dan ook op een pagina kan zien' },
  { speakerName: 'Coach', timeLabel: '00:07', text: 'Hmmm dat klinkt wel interessant, maar hoe weet je dan wie wat heeft gezegd?' },
  { speakerName: 'Levi', timeLabel: '00:16', text: 'Nouja de AI die er achter zit die kan dat op een vrij precieze manier achterhalen' },
]

type Props = {
  searchValue: string
  onChangeSearchValue: (value: string) => void
  shouldFillAvailableHeight?: boolean
  transcript: string | null
  transcriptionStatus: 'idle' | 'transcribing' | 'generating' | 'done' | 'error'
  transcriptionError: string | null
  onSeekToSeconds?: (seconds: number) => void
  onRetryTranscription?: () => void
}

type ParsedTranscriptLine = {
  id: string
  speakerKey: string
  messageText: string
  timeSeconds: number | null
}

function parseTranscriptLine(line: string, index: number): ParsedTranscriptLine {
  const timeMatch = line.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?(?:[.,]\d{1,3})?\b/)
  const timeLabel = timeMatch ? timeMatch[0] : null
  const timeSeconds = timeLabel ? parseTimeLabelToSeconds(timeLabel) : null
  const lineWithoutTime = timeLabel ? line.replace(timeLabel, '').replace(/\[|\]/g, '').trim() : line.trim()
  const speakerSeparatorIndex = lineWithoutTime.indexOf(':')
  const speakerLabel = speakerSeparatorIndex >= 0 ? lineWithoutTime.slice(0, speakerSeparatorIndex).trim() : ''
  const messageText = speakerSeparatorIndex >= 0 ? lineWithoutTime.slice(speakerSeparatorIndex + 1).trim() : lineWithoutTime
  return {
    id: `${index}-${line}`,
    speakerKey: speakerLabel.toLowerCase(),
    messageText,
    timeSeconds,
  }
}

export function TranscriptTabPanel({
  searchValue,
  onChangeSearchValue,
  shouldFillAvailableHeight = true,
  transcript,
  transcriptionStatus,
  transcriptionError,
  onSeekToSeconds,
  onRetryTranscription,
}: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any

  const hasTranscript = Boolean(transcript && transcript.trim())
  const isTranscribing = transcriptionStatus === 'transcribing'
  const isGenerating = transcriptionStatus === 'generating'
  const isLoading = isTranscribing || (isGenerating && !hasTranscript)
  const hasError = transcriptionStatus === 'error'
  const hasContent = hasTranscript && (transcriptionStatus === 'done' || transcriptionStatus === 'generating')

  const filteredTranscript = transcript && searchValue.trim() ? transcript.split('\n').filter((line) => line.toLowerCase().includes(searchValue.trim().toLowerCase())) : transcript?.split('\n') || []

  const parsedTranscriptLines = filteredTranscript.map((line, index) => parseTranscriptLine(line, index))
  const firstSpeakerKey = parsedTranscriptLines.find((line) => line.speakerKey)?.speakerKey ?? ''

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
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            {/* Loading message */}
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.selected} />
            <Text style={styles.loadingText}>Transcript wordt gegenereerd</Text>
            </View>
          </View>
        ) : hasError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {transcriptionError || 'Er is een fout opgetreden bij het genereren van de transcriptie.'}
            </Text>
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
            parsedTranscriptLines.map((line) => {
              const isFirstSpeaker = firstSpeakerKey ? line.speakerKey === firstSpeakerKey : true
              const isSeekEnabled = !!onSeekToSeconds && line.timeSeconds !== null
              return (
                <Pressable
                  key={line.id}
                  onPress={() => {
                    if (!isSeekEnabled || line.timeSeconds === null) return
                    onSeekToSeconds?.(line.timeSeconds)
                  }}
                  style={({ hovered }) => [
                    styles.row,
                    styles.messageRow,
                    isFirstSpeaker ? styles.messageRowPrimary : styles.messageRowSecondary,
                    styles.messageRowClickable,
                    hovered ? styles.messageRowHovered : undefined,
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

