import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { ClientPageMicrophoneIcon } from '../../icons/ClientPageSvgIcons'
import { Text } from '../../ui/Text'

type Props = {
  onOpenRecorder: () => void
}

export function RecordScreen({ onOpenRecorder }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
        <Text isSemibold style={styles.title}>Opnemen</Text>
        <Text style={styles.subtitle}>Start een nieuwe sessie-opname. De recorder opent in een modal met dezelfde bestaande flow.</Text>
      </View>

      <View style={styles.layoutRow}>
        <View style={styles.recorderCard}>
          <View style={styles.recorderCardHeader}>
            <View>
              <Text isSemibold style={styles.sessionLabel}>Nieuwe sessie</Text>
              <Text style={styles.sessionSubLabel}>Recorder</Text>
            </View>
          </View>

          <View style={styles.wavePlaceholder}>
            <Text style={styles.wavePlaceholderText}>Audio visualisatie</Text>
          </View>

          <Text isSemibold style={styles.timerText}>00:00:00</Text>

          <View style={styles.actionsRow}>
            <Pressable
              onPress={onOpenRecorder}
              style={({ hovered }) => [styles.primaryAction, hovered ? styles.primaryActionHovered : undefined]}
            >
              <ClientPageMicrophoneIcon size={18} />
              <Text isSemibold style={styles.primaryActionText}>Opname starten</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text isSemibold style={styles.notesTitle}>Notities</Text>
          <View style={styles.noteBubble}>
            <Text style={styles.noteTime}>12:46</Text>
            <Text style={styles.noteText}>Notities verschijnen hier zodra de opname actief is.</Text>
          </View>
          <View style={styles.noteBubble}>
            <Text style={styles.noteTime}>05:20</Text>
            <Text style={styles.noteText}>Gebruik de recorder modal om op te nemen, te pauzeren en te bewaren.</Text>
          </View>
          <View style={styles.notesInputRow}>
            <Text style={styles.notesInputPlaceholder}>Typ een notitie...</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  pageHeader: {
    gap: 6,
  },
  title: {
    fontSize: 40,
    lineHeight: 48,
    color: colors.textStrong,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  layoutRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  recorderCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 24,
    gap: 18,
    minHeight: 560,
  },
  recorderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLabel: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textStrong,
  },
  sessionSubLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: '#93858D',
  },
  wavePlaceholder: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: '#F3F2F5',
    borderWidth: 1,
    borderColor: '#E9E7EC',
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wavePlaceholderText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#93858D',
  },
  timerText: {
    fontSize: 48,
    lineHeight: 56,
    color: colors.textStrong,
    textAlign: 'center',
  },
  actionsRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  primaryAction: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.selected,
    backgroundColor: colors.selected,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryActionHovered: {
    backgroundColor: '#A50058',
    borderColor: '#A50058',
  },
  primaryActionText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  notesCard: {
    width: 430,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    minHeight: 560,
  },
  notesTitle: {
    fontSize: 32,
    lineHeight: 40,
    color: colors.textStrong,
  },
  noteBubble: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F9FAFB',
    padding: 12,
    gap: 8,
  },
  noteTime: {
    alignSelf: 'flex-start',
    borderRadius: 4,
    backgroundColor: '#EDF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 14,
    lineHeight: 18,
    color: '#0065F4',
  },
  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2C111F',
  },
  notesInputRow: {
    marginTop: 'auto',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  notesInputPlaceholder: {
    fontSize: 16,
    lineHeight: 20,
    color: '#93858D',
  },
})
