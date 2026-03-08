import React from 'react'
import { Animated, Pressable, TextInput, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../ui/CoachscribeLogo'
import { ModalCloseIcon } from '../../../icons/ModalCloseIcon'
import { PauseIcon } from '../../../icons/PauseIcon'
import { PlaySmallIcon } from '../../../icons/PlaySmallIcon'
import { StopSquareIcon } from '../../../icons/StopSquareIcon'
import { MoreOptionsIcon } from '../../../icons/MoreOptionsIcon'
import { SendIcon } from '../../../icons/SendIcon'
import { webTransitionSmooth } from '../../../design/theme/webTransitions'
import { formatTimeLabel } from '../newInputModalUtils'
import { styles } from '../newInputModalStyles'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  stop: () => void
  pause: () => void
  resume: () => void
}

type Props = {
  bars: number[]
  displayedRecordingElapsedSeconds: number
  isRecordingPaused: boolean
  limitedMode: boolean
  liveWaveHeights: number[]
  recordingExpandProgress: Animated.Value
  recordingNotesRevealProgress: Animated.Value
  shouldRenderNotesPanel: boolean
  selectedCoacheeName: string | null
  recordingNotes: Array<{ id: string; seconds: number; text: string }>
  recordingNoteDraft: string
  recorder: RecorderState
  waveBarCount: number
  onCancelRecording: () => void
  onRecordingNoteDraftChange: (value: string) => void
  onRetryRecordingAfterError: () => void
  onSaveRecordingNote: () => void
  onSetWaveBarCount: (count: number) => void
}

export function RecordingStep({
  bars,
  displayedRecordingElapsedSeconds,
  isRecordingPaused,
  limitedMode,
  liveWaveHeights,
  recordingExpandProgress,
  recordingNotesRevealProgress,
  shouldRenderNotesPanel,
  selectedCoacheeName,
  recordingNotes,
  recordingNoteDraft,
  recorder,
  waveBarCount,
  onCancelRecording,
  onRecordingNoteDraftChange,
  onRetryRecordingAfterError,
  onSaveRecordingNote,
  onSetWaveBarCount,
}: Props) {
  const recorderNode = (
    <View style={styles.recordingMainCard}>
      <View style={styles.recordingCardHeader}>
        <View style={styles.recordingCardIdentity}>
          <View style={styles.recordingCardAvatar} />
          <View>
            <Text isSemibold style={styles.recordingCardName}>{selectedCoacheeName || 'Naamloze opname'}</Text>
            <Text style={styles.recordingCardSessionLabel}>Sessie #9</Text>
          </View>
        </View>
        <View style={styles.recordingCardMoreButton}>
          <MoreOptionsIcon color="#2C111F" size={18} />
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
            onPress={onCancelRecording}
            style={({ hovered }) => [
              styles.softCircle,
              limitedMode ? styles.softCircleLimited : undefined,
              hovered ? styles.softCircleHovered : undefined,
            ]}
          >
            <ModalCloseIcon size={55} />
          </Pressable>

          <Pressable
            onPress={() => {
              if (recorder.status === 'error') {
                onRetryRecordingAfterError()
                return
              }
              recorder.stop()
            }}
            style={({ hovered }) => [
              styles.primaryCircle,
              limitedMode ? styles.primaryCircleLimited : undefined,
              webTransitionSmooth,
              hovered ? styles.primaryCircleHovered : undefined,
            ]}
          >
            <StopSquareIcon />
          </Pressable>

          <Pressable
            onPress={() => {
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
                    <View style={styles.recordingNoteTimestampPill}>
                      <Text isSemibold style={styles.recordingNoteTimestamp}>{formatTimeLabel(note.seconds)}</Text>
                    </View>
                    <Text style={styles.recordingNoteText}>{note.text}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.recordingNoteComposer}>
                <View style={styles.recordingNoteInputWrap}>
                  <TextInput
                    value={recordingNoteDraft}
                    onChangeText={onRecordingNoteDraftChange}
                    onKeyPress={(event: any) => {
                      if (event?.nativeEvent?.key !== 'Enter' || !event?.nativeEvent?.shiftKey) return
                      event?.preventDefault?.()
                      onSaveRecordingNote()
                    }}
                    blurOnSubmit={false}
                    multiline
                    textAlignVertical="top"
                    placeholder=""
                    placeholderTextColor="#95888F"
                    style={[styles.recordingNoteInput, ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any)]}
                  />
                  <Pressable
                    onPress={onSaveRecordingNote}
                    style={({ hovered }) => [styles.recordingNoteSendButton, hovered ? styles.recordingNoteSendButtonHovered : undefined]}
                  >
                    <SendIcon size={14} />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ) : null}
        </View>
      )}
    </View>
  )
}
