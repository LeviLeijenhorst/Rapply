import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import type { Session } from '../../../storage/types'
import { Text } from '../../../ui/Text'

type Props = {
  transcript: string | null
  transcriptionStatus: Session['transcriptionStatus']
}

function splitTranscript(transcript: string | null) {
  return String(transcript || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

export function SessionTranscriptCard({ transcript, transcriptionStatus }: Props) {
  const lines = useMemo(() => splitTranscript(transcript), [transcript])
  const previewLines = lines.slice(0, 6)
  const showBusyState = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'

  return (
    <View style={styles.card}>
      <Text isSemibold style={styles.heading}>Transcript</Text>
      {previewLines.length === 0 ? (
        <Text style={styles.emptyText}>{showBusyState ? 'Transcript wordt gegenereerd.' : 'Voor deze sessie is nog geen transcript beschikbaar.'}</Text>
      ) : (
        <View style={styles.lineList}>
          {previewLines.map((line, index) => (
            <Text key={`${index}-${line.slice(0, 10)}`} style={styles.lineText}>{line}</Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.textStrong,
  },
  lineList: {
    gap: 6,
  },
  lineText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
})
