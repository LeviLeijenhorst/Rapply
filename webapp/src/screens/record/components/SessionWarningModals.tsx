import React from 'react'
import { Pressable, View } from 'react-native'

import { Modal } from '../../../ui/animated/Modal'
import { Text } from '../../../ui/Text'
import { formatMinutesLabel } from '../utils'
import { styles } from '../styles'

type InsufficientMinutesContext = {
  remainingSeconds: number
  requiredSeconds: number
  kind: 'recording' | 'upload'
}

type SessionWarningModalsModel = {
  insufficientMinutesContext: InsufficientMinutesContext | null
  isInsufficientMinutesWarningVisible: boolean
  isRecordedCloseWarningVisible: boolean
  onCloseInsufficientMinutes: () => void
  onCloseRecordedWarning: () => void
  onConfirmRecordedDelete: () => void
  onDownloadAudioForInsufficientMinutes: () => void
  onOpenSubscriptionFromInsufficientMinutes: () => void
}

export function SessionWarningModals({
  insufficientMinutesContext,
  isInsufficientMinutesWarningVisible,
  isRecordedCloseWarningVisible,
  onCloseInsufficientMinutes,
  onCloseRecordedWarning,
  onConfirmRecordedDelete,
  onDownloadAudioForInsufficientMinutes,
  onOpenSubscriptionFromInsufficientMinutes,
}: SessionWarningModalsModel) {
  return (
    <>
      <Modal
        visible={isRecordedCloseWarningVisible}
        onClose={onCloseRecordedWarning}
        contentContainerStyle={styles.closeWarningContainer}
      >
        <View style={styles.closeWarningContent}>
          <Text isBold style={styles.closeWarningTitle}>
            Weet je zeker dat je de opname wil verwijderen?
          </Text>
          <Text style={styles.closeWarningText}>
            Als je verwijdert, gaat je huidige opname of invoer verloren.
          </Text>
        </View>
        <View style={styles.recordedCloseWarningFooter}>
          <Pressable
            onPress={onCloseRecordedWarning}
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
            onPress={onConfirmRecordedDelete}
            style={({ hovered }) => [
              styles.recordedCloseWarningPrimaryButton,
              hovered ? styles.recordedCloseWarningPrimaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.recordedCloseWarningPrimaryButtonText}>
              Verwijderen
            </Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={isInsufficientMinutesWarningVisible}
        onClose={onCloseInsufficientMinutes}
        contentContainerStyle={styles.insufficientMinutesModalContainer}
      >
        <View style={styles.insufficientMinutesModalContent}>
          <Text isBold style={styles.insufficientMinutesModalTitle}>
            Onvoldoende minuten voor transcriptie
          </Text>
          <Text style={styles.insufficientMinutesModalText}>
            Deze opname duurt ongeveer {insufficientMinutesContext ? formatMinutesLabel(insufficientMinutesContext.requiredSeconds) : '0 minuten'} en je hebt nog{' '}
            {insufficientMinutesContext ? formatMinutesLabel(insufficientMinutesContext.remainingSeconds) : '0 minuten'} over.
          </Text>
        </View>
        <View style={styles.insufficientMinutesFooter}>
          <Pressable
            onPress={onDownloadAudioForInsufficientMinutes}
            style={({ hovered }) => [
              styles.insufficientMinutesFooterSecondaryButton,
              hovered ? styles.insufficientMinutesFooterSecondaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.insufficientMinutesFooterSecondaryButtonText}>
              Audio downloaden
            </Text>
          </Pressable>
          <Pressable
            onPress={onOpenSubscriptionFromInsufficientMinutes}
            style={({ hovered }) => [
              styles.insufficientMinutesFooterPrimaryButton,
              hovered ? styles.insufficientMinutesFooterPrimaryButtonHovered : undefined,
            ]}
          >
            <Text isBold style={styles.insufficientMinutesFooterPrimaryButtonText}>
              Mijn abonnement
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  )
}

