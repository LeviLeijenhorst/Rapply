import React from 'react'
import { Pressable, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../CoachscribeLogo'
import { ModalCloseIcon } from '../../../icons/ModalCloseIcon'
import { PauseIcon } from '../../../icons/PauseIcon'
import { PlaySmallIcon } from '../../../icons/PlaySmallIcon'
import { StopSquareIcon } from '../../../icons/StopSquareIcon'
import { webTransitionSmooth } from '../../../design/theme/webTransitions'
import { formatTimeLabel } from '../newSessionModalUtils'
import { styles } from '../newSessionModalStyles'

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
  recorder: RecorderState
  waveBarCount: number
  onCancelRecording: () => void
  onRetryRecordingAfterError: () => void
  onSetWaveBarCount: (count: number) => void
}

export function RecordingStep({
  bars,
  displayedRecordingElapsedSeconds,
  isRecordingPaused,
  limitedMode,
  liveWaveHeights,
  recorder,
  waveBarCount,
  onCancelRecording,
  onRetryRecordingAfterError,
  onSetWaveBarCount,
}: Props) {
  return (
    <View style={[styles.recordingBody, limitedMode ? styles.recordingBodyLimited : undefined]}>
      {limitedMode ? (
        <View style={[styles.mobileStepBrand, styles.mobileRecordingBrand]}>
          <CoachscribeLogo />
        </View>
      ) : null}
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
  )
}

