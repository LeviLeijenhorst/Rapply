import React from 'react'
import { Pressable, View } from 'react-native'

import { Modal } from '../../../ui/animated/Modal'
import { Text } from '../../../ui/Text'
import { ModalCloseIcon } from '../../../icons/ModalCloseIcon'
import { PauseIcon } from '../../../icons/PauseIcon'
import { PlaySmallIcon } from '../../../icons/PlaySmallIcon'
import { StopSquareIcon } from '../../../icons/StopSquareIcon'
import { formatTimeLabel } from '../utils'
import { styles } from '../styles'

type MinimizedRecordingLayerModel = {
  bars: number[]
  displayedRecordingElapsedSeconds: number
  isMinimizedCloseWarningVisible: boolean
  isRecordingPaused: boolean
  liveWaveHeights: number[]
  onCloseWarningCancel: () => void
  onCloseWarningConfirm: () => void
  onPauseOrResume: () => void
  onRetryRecordingAfterError: () => void
  onShowCloseWarning: () => void
  onStopRecording: () => void
  onRestore: () => void
  recorderStatus: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
}

export function MinimizedRecordingLayer({
  bars,
  displayedRecordingElapsedSeconds,
  isMinimizedCloseWarningVisible,
  isRecordingPaused,
  liveWaveHeights,
  onCloseWarningCancel,
  onCloseWarningConfirm,
  onPauseOrResume,
  onRetryRecordingAfterError,
  onShowCloseWarning,
  onStopRecording,
  onRestore,
  recorderStatus,
}: MinimizedRecordingLayerModel) {
  return (
    <>
      <View style={styles.minimizedOverlay} pointerEvents="box-none">
        <Pressable onPress={onRestore} style={styles.minimizedBar}>
          <View style={styles.minimizedInfo}>
            <View style={styles.minimizedTimeContainer}>
              <Text isSemibold style={styles.minimizedTimeText}>
                {formatTimeLabel(displayedRecordingElapsedSeconds)}
              </Text>
            </View>
            <View style={styles.minimizedWaveform}>
              {bars.map((index) => {
                const rawHeight = liveWaveHeights[index] ?? 6
                if (rawHeight <= 8) {
                  return <View key={index} style={[styles.minimizedWaveBar, styles.minimizedWaveBarSilent]} />
                }
                const normalizedHeight = Math.min(1, Math.max(0, (rawHeight - 6) / 194))
                const height = 4 + normalizedHeight * 12
                return <View key={index} style={[styles.minimizedWaveBar, { height }]} />
              })}
            </View>
          </View>
          <View style={styles.minimizedControls}>
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.()
                onPauseOrResume()
              }}
              style={({ hovered }) => [
                styles.minimizedControlButton,
                styles.minimizedSoftButton,
                hovered ? styles.minimizedSoftButtonHovered : undefined,
              ]}
            >
              {isRecordingPaused ? (
                <View style={styles.minimizedPlayIconWrapper}>
                  <PlaySmallIcon size={10} />
                </View>
              ) : (
                <PauseIcon size={12} />
              )}
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.()
                if (recorderStatus === 'error') {
                  onRetryRecordingAfterError()
                  return
                }
                onStopRecording()
              }}
              style={({ hovered }) => [styles.minimizedStopButton, hovered ? styles.minimizedStopButtonHovered : undefined]}
            >
              <StopSquareIcon size={12} />
            </Pressable>
            <Pressable
              onPress={(event) => {
                event.stopPropagation?.()
                onShowCloseWarning()
              }}
              style={({ hovered }) => [
                styles.minimizedControlButton,
                styles.minimizedSoftButton,
                hovered ? styles.minimizedSoftButtonHovered : undefined,
              ]}
            >
              <ModalCloseIcon size={22} />
            </Pressable>
          </View>
        </Pressable>
      </View>

      <Modal
        visible={isMinimizedCloseWarningVisible}
        onClose={onCloseWarningCancel}
        contentContainerStyle={styles.closeWarningContainer}
      >
        <View style={styles.closeWarningContent}>
          <Text isBold style={styles.closeWarningTitle}>
            Weet je zeker dat je wil sluiten?
          </Text>
          <Text style={styles.closeWarningText}>
            Als je sluit, gaat je huidige opname of invoer verloren.
          </Text>
        </View>
        <View style={styles.recordedCloseWarningFooter}>
          <Pressable
            onPress={onCloseWarningCancel}
            style={({ hovered }) => [
              styles.recordedCloseWarningSecondaryButton,
              styles.cancelButtonNoBottomLeftRadius,
              hovered ? styles.recordedCloseWarningSecondaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.recordedCloseWarningSecondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={onCloseWarningConfirm}
            style={({ hovered }) => [
              styles.recordedCloseWarningPrimaryButton,
              hovered ? styles.recordedCloseWarningPrimaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.recordedCloseWarningPrimaryButtonText}>
              Sluiten
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  )
}

