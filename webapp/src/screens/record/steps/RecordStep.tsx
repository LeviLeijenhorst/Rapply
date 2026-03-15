import React from 'react'
import { Animated, Pressable, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { ModalCloseIcon } from '../../../icons/ModalCloseIcon'
import { PauseIcon } from '../../../icons/PauseIcon'
import { PlaySmallIcon } from '../../../icons/PlaySmallIcon'
import { StopSquareIcon } from '../../../icons/StopSquareIcon'
import { webTransitionSmooth } from '../../../design/theme/transitions'
import { ChatComposer } from '../../shared/components/chat/ChatComposer'
import { formatTimeLabel } from '../utils'
import { styles } from '../styles'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  stop: () => void
  pause: () => void
  resume: () => void
}

type RecordStepModel = {
  bars: number[]
  displayedRecordingElapsedSeconds: number
  isRecordingPaused: boolean
  limitedMode: boolean
  liveWaveHeights: number[]
  recordingNotesRevealProgress: Animated.Value
  shouldRenderNotesPanel: boolean
  selectedClientName: string | null
  recordingNotes: Array<{ id: string; seconds: number; text: string }>
  editingRecordingNoteId: string | null
  recordingNoteDraft: string
  recorder: RecorderState
  waveBarCount: number
  isTransitioning: boolean
  onCancelRecording: () => void
  onRecordingNoteDraftChange: (value: string) => void
  onEditRecordingNote: (noteId: string) => void
  onDeleteRecordingNote: (noteId: string) => void
  onRetryRecordingAfterError: () => void
  onSaveRecordingNote: () => void
  onCancelEditingRecordingNote: () => void
  onSetWaveBarCount: (count: number) => void
  onStopRecording: () => void
}

export function RecordStep({
  bars,
  displayedRecordingElapsedSeconds,
  isRecordingPaused,
  limitedMode,
  liveWaveHeights,
  recordingNotesRevealProgress,
  shouldRenderNotesPanel,
  selectedClientName,
  recordingNotes,
  editingRecordingNoteId,
  recordingNoteDraft,
  recorder,
  waveBarCount,
  isTransitioning,
  onCancelRecording,
  onRecordingNoteDraftChange,
  onEditRecordingNote,
  onDeleteRecordingNote,
  onRetryRecordingAfterError,
  onSaveRecordingNote,
  onCancelEditingRecordingNote,
  onSetWaveBarCount,
  onStopRecording,
}: RecordStepModel) {
  const recorderNode = (
    <View style={styles.recordingMainCard}>
      <View style={styles.recordingCardHeader}>
        <View style={styles.recordingCardIdentity}>
          <View style={styles.recordingCardAvatar} />
          <View>
            <Text isSemibold style={styles.recordingCardName}>{selectedClientName || 'Naamloze opname'}</Text>
            <Text style={styles.recordingCardInputLabel}>Sessie #9</Text>
          </View>
        </View>
      </View>

      <View style={styles.recordingMain}>
        <View
          style={[styles.waveformContainer, limitedMode ? styles.waveformContainerLimited : undefined]}
          onLayout={(event) => {
            const width = event.nativeEvent.layout.width
            const padding = limitedMode ? 20 : 48
            const barWidth = 8
            const gap = 8
            const available = Math.max(0, width - padding * 2)
            const nextCount = Math.max(10, Math.floor((available + gap) / (barWidth + gap)))
            if (nextCount !== waveBarCount) onSetWaveBarCount(nextCount)
          }}
        >
          {bars.map((index) => {
            const rawHeight = liveWaveHeights[index] ?? 8
            const height = rawHeight <= 8 ? 8 : rawHeight
            return <View key={index} style={[styles.waveBar, { height, borderRadius: height <= 8 ? 4 : 8 }]} />
          })}
        </View>

        <Text isSemibold style={[styles.timerText, limitedMode ? styles.timerTextLimited : undefined]}>
          {formatTimeLabel(displayedRecordingElapsedSeconds)}
        </Text>

        <View style={[styles.recordingControls, limitedMode ? styles.recordingControlsLimited : undefined]}>
          <Pressable
            disabled={isTransitioning}
            onPress={onCancelRecording}
            style={({ hovered }) => [
              styles.softCircle,
              limitedMode ? styles.softCircleLimited : undefined,
              isTransitioning ? styles.recordingControlDisabled : undefined,
              hovered ? styles.softCircleHovered : undefined,
            ]}
          >
            <ModalCloseIcon size={55} />
          </Pressable>

          <Pressable
            disabled={isTransitioning}
            onPress={() => {
              if (isTransitioning) return
              if (recorder.status === 'error') {
                onRetryRecordingAfterError()
                return
              }
              onStopRecording()
            }}
            style={({ hovered }) => [
              styles.primaryCircle,
              limitedMode ? styles.primaryCircleLimited : undefined,
              isTransitioning ? styles.recordingControlDisabled : undefined,
              webTransitionSmooth,
              hovered ? styles.primaryCircleHovered : undefined,
            ]}
          >
            <StopSquareIcon />
          </Pressable>

          <Pressable
            disabled={isTransitioning}
            onPress={() => {
              if (isTransitioning) return
              if (recorder.status === 'recording') {
                recorder.pause()
                return
              }
              if (recorder.status === 'paused') {
                recorder.resume()
              }
            }}
            style={({ hovered }) => [
              styles.softCircle,
              limitedMode ? styles.softCircleLimited : undefined,
              isTransitioning ? styles.recordingControlDisabled : undefined,
              hovered ? styles.softCircleHovered : undefined,
            ]}
          >
            {isRecordingPaused ? <PlaySmallIcon size={24} /> : <PauseIcon />}
          </Pressable>
        </View>
      </View>
    </View>
  )

  return (
    <View style={[styles.recordingBody, limitedMode ? styles.recordingBodyLimited : undefined]}>
      {limitedMode ? (
        <View style={[styles.mobileStepBrand, styles.mobileRecordingBrand]}>
          <CoachscribeLogo />
        </View>
      ) : null}
      {limitedMode ? (
        recorderNode
      ) : (
        <View style={styles.recordingLayoutRow}>
          {recorderNode}
          {shouldRenderNotesPanel ? (
            <Animated.View
              style={[
                styles.recordingNotesModal,
                {
                  opacity: recordingNotesRevealProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }) as unknown as number,
                  transform: [
                    {
                      translateX: recordingNotesRevealProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [56, 0],
                      }) as unknown as number,
                    },
                  ],
                },
              ]}
            >
              <Text isSemibold style={styles.recordingNotesTitle}>Notities</Text>
              {recordingNotes.length === 0 ? <Text style={styles.recordingNotesBody}>Voeg notities toe tijdens de opname.</Text> : null}
              <View style={styles.recordingNotesList}>
                {recordingNotes.map((note) => (
                  <View key={note.id} style={styles.recordingNoteItem}>
                    <View style={styles.recordingNoteHeaderRow}>
                      <View style={styles.recordingNoteTimestampPill}>
                        <Text isSemibold style={styles.recordingNoteTimestamp}>{formatTimeLabel(note.seconds)}</Text>
                      </View>
                      <View style={styles.recordingNoteActions}>
                        <Pressable
                          disabled={isTransitioning}
                          onPress={() => onEditRecordingNote(note.id)}
                          style={({ hovered }) => [styles.recordingNoteActionButton, hovered ? styles.recordingNoteActionButtonHovered : undefined]}
                        >
                          <Text style={styles.recordingNoteActionText}>Bewerken</Text>
                        </Pressable>
                        <Pressable
                          disabled={isTransitioning}
                          onPress={() => onDeleteRecordingNote(note.id)}
                          style={({ hovered }) => [styles.recordingNoteActionButton, hovered ? styles.recordingNoteActionButtonHovered : undefined]}
                        >
                          <Text style={styles.recordingNoteActionText}>Verwijderen</Text>
                        </Pressable>
                      </View>
                    </View>
                    <Text style={styles.recordingNoteText}>{note.text}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.recordingNoteComposer}>
                {editingRecordingNoteId ? (
                  <View style={styles.recordingEditIndicatorRow}>
                    <Text style={styles.recordingEditIndicatorText}>Notitie bewerken</Text>
                    <Pressable onPress={onCancelEditingRecordingNote} style={({ hovered }) => [styles.recordingNoteActionButton, hovered ? styles.recordingNoteActionButtonHovered : undefined]}>
                      <Text style={styles.recordingNoteActionText}>Annuleer</Text>
                    </Pressable>
                  </View>
                ) : null}
                <View style={styles.recordingNoteComposerInner}>
                  <ChatComposer
                    value={recordingNoteDraft}
                    onChangeValue={onRecordingNoteDraftChange}
                    onSend={onSaveRecordingNote}
                    showDisclaimer={false}
                    sendIconVariant="arrow"
                    isSendDisabled={isTransitioning || recordingNoteDraft.trim().length === 0}
                  />
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>
      )}
    </View>
  )
}

