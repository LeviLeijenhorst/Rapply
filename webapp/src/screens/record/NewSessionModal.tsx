import React from 'react'
import { Animated, Pressable, TextInput, View } from 'react-native'

import { colors } from '../../design/theme/colors'
import { webTransitionSmooth } from '../../design/theme/transitions'
import { FolderOpenIcon } from '../../icons/FolderOpenIcon'
import { MinimizeIcon } from '../../icons/MinimizeIcon'
import { Text } from '../../ui/Text'
import { MainContainer } from '../../ui/animated/MainContainer'
import { StepBody } from './StepBody'
import { MinimizedRecordingLayer } from './components/MinimizedRecordingLayer'
import { InputWarningModals } from './components/InputWarningModals'
import { useNewInputModalController } from './state/useNewInputModalController'
import type { NewInputModalArgs } from './types'
import { styles } from './styles'
import { formatTimeLabel } from './utils'

type InputModalViewModel = ReturnType<typeof useNewInputModalController>['viewProps']

export function NewInputModal(args: NewInputModalArgs) {
  const controller = useNewInputModalController(args)
  if (!controller.isRendered) return null
  return <InputModalContent {...controller.viewProps} />
}

function InputModalContent({
  audioDurationSeconds,
  audioPreviewUrl,
  backdropOpacity,
  bars,
  clientDropdownMaxHeight,
  clientOptions,
  clientTriggerRef,
  defaultDropdownMaxHeight,
  displayedRecordingElapsedSeconds,
  displayedRecordingMaxSeconds,
  dropdownSafeBottom,
  expandedRecordingWidth,
  gesprekOptionLabel,
  gespreksverslagOptionLabel,
  handleBackdropPress,
  handleOpenSubscriptionFromInsufficientMinutes,
  handlePrimaryActionPress,
  handleSelectClient,
  handleSelectOption,
  handleAddClient,
  handleCancelRecording,
  handleCloseInsufficientMinutes,
  handleCloseRecordedWarning,
  handleConfirmRecordedDelete,
  handleConsentBack,
  handleDownloadAudioForInsufficientMinutes,
  handleMinimizedCloseWarningCancel,
  handleMinimizedCloseWarningConfirm,
  handleMinimizedPauseOrResume,
  handleToggleAudioSave,
  handleToggleClientDropdown,
  handleToggleConsent,
  hasRecordingConsent,
  insufficientMinutesContext,
  isClientOpen,
  isCompactConsent,
  isCompactFooter,
  isCompactUploadFooter,
  isConsentStep,
  isDesktopRecordingStep,
  isInsufficientMinutesWarningVisible,
  isLimitedFooter,
  isMinimizedCloseWarningVisible,
  isPrimaryActionDisabled,
  isRecordedCloseWarningVisible,
  isRecordingPaused,
  isUploadDragActive,
  isUploadStep,
  limitedMode,
  liveWaveHeights,
  minimizeProgress,
  minimizeScaleX,
  minimizeScaleY,
  minimizeTranslateX,
  minimizeTranslateY,
  modalHeight,
  modalOpacity,
  modalScale,
  modalTranslateY,
  openConsentHelpPage,
  openFilePicker,
  recorder,
  recordingExpandProgress,
  recordingLimitRemainingSeconds,
  recordingNoteDraft,
  recordingNotes,
  recordingNotesRevealProgress,
  requestClose,
  retryRecordingAfterError,
  saveRecordingNote,
  selectedAudioFile,
  selectedClientName,
  selectedOption,
  selectedOptionGroup,
  sessionTitle,
  sessionTitleInputRef,
  setAudioDurationSeconds,
  setIsMinimizedCloseWarningVisible,
  setRecordingNoteDraft,
  setInputTitle,
  setWaveBarCount,
  shouldRenderRecordingNotesPanel,
  shouldSaveAudio,
  shouldShowMinimized,
  shouldShowRecordingLimitWarning,
  showFooter,
  startMinimizeModal,
  startRestoreModal,
  step,
  title,
  uploadDropAreaRef,
  uploadFileDurationWarning,
  waveBarCount,
  windowHeight,
  windowWidth,
}: InputModalViewModel) {
  if (shouldShowMinimized) {
    return (
      <MinimizedRecordingLayer
        bars={bars}
        displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
        isMinimizedCloseWarningVisible={isMinimizedCloseWarningVisible}
        isRecordingPaused={isRecordingPaused}
        liveWaveHeights={liveWaveHeights}
        recorderStatus={recorder.status}
        onPauseOrResume={handleMinimizedPauseOrResume}
        onRetryRecordingAfterError={retryRecordingAfterError}
        onShowCloseWarning={() => setIsMinimizedCloseWarningVisible(true)}
        onStopRecording={() => recorder.stop()}
        onRestore={startRestoreModal}
        onCloseWarningCancel={handleMinimizedCloseWarningCancel}
        onCloseWarningConfirm={handleMinimizedCloseWarningConfirm}
      />
    )
  }

  return (
    <View style={[styles.overlay, limitedMode ? styles.overlayLimited : undefined]} pointerEvents="auto">
      {!limitedMode ? <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} pointerEvents="none" /> : null}
      {!limitedMode ? <Pressable onPress={handleBackdropPress} style={styles.backdropPressable} pointerEvents="auto" /> : null}
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.container,
          isDesktopRecordingStep ? styles.containerRecording : undefined,
          limitedMode ? styles.containerLimited : undefined,
          !limitedMode
            ? {
                width: recordingExpandProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [Math.min(747, windowWidth * 0.95), Math.min(expandedRecordingWidth, windowWidth * 0.95)],
                }) as unknown as number,
                height: modalHeight,
              }
            : null,
          {
            opacity: modalOpacity,
            transform: [
              {
                translateX: !limitedMode
                  ? recordingExpandProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -36],
                    })
                  : 0,
              },
              { translateY: modalTranslateY },
              { scale: modalScale },
              {
                translateX: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, minimizeTranslateX],
                }),
              },
              {
                translateY: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, minimizeTranslateY],
                }),
              },
              {
                scaleX: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, minimizeScaleX],
                }),
              },
              {
                scaleY: minimizeProgress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, minimizeScaleY],
                }),
              },
            ],
          },
        ]}
      >
        {!limitedMode && !isDesktopRecordingStep ? (
          <View style={styles.header}>
            <Text isBold style={styles.headerTitle}>
              {title}
            </Text>
            <View style={styles.headerRight}>
              {step === 'recording' ? (
                <Pressable
                  onPress={startMinimizeModal}
                  style={({ hovered }) => [styles.iconButton, webTransitionSmooth, hovered ? styles.iconButtonHovered : undefined]}
                >
                  <MinimizeIcon />
                </Pressable>
              ) : null}
              {step === 'recorded' ? <Text style={styles.headerMetaText}>Jan 22 2026, 19:28</Text> : null}
            </View>
          </View>
        ) : null}

        {step === 'recording' && shouldShowRecordingLimitWarning ? (
          <View pointerEvents="none" style={styles.recordingWarningOverlay}>
            <View style={styles.recordingWarningBanner}>
              <Text isSemibold style={styles.recordingWarningTitle}>
                Opname stopt over {formatTimeLabel(recordingLimitRemainingSeconds)}
              </Text>
              <Text style={styles.recordingWarningText}>Maximum opnametijd is {formatTimeLabel(displayedRecordingMaxSeconds)}.</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.body, step === 'select' ? styles.bodySelect : undefined, isDesktopRecordingStep ? styles.bodyRecording : undefined]}>
          <MainContainer contentKey={step} style={styles.stepContent}>
            <StepBody
              audioDurationSeconds={audioDurationSeconds}
              audioPreviewUrl={audioPreviewUrl}
              bars={bars}
              clientDropdownMaxHeight={clientDropdownMaxHeight}
              clientOptions={clientOptions}
              defaultDropdownMaxHeight={defaultDropdownMaxHeight}
              displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
              gesprekOptionLabel={gesprekOptionLabel}
              gespreksverslagOptionLabel={gespreksverslagOptionLabel}
              hasRecordingConsent={hasRecordingConsent}
              isClientOpen={isClientOpen}
              isCompactConsent={isCompactConsent}
              isRecordingPaused={isRecordingPaused}
              isUploadDragActive={isUploadDragActive}
              recordingNotes={recordingNotes}
              recordingNoteDraft={recordingNoteDraft}
              limitedMode={limitedMode}
              liveWaveHeights={liveWaveHeights}
              recorder={recorder}
              recordingNotesRevealProgress={recordingNotesRevealProgress}
              shouldRenderRecordingNotesPanel={shouldRenderRecordingNotesPanel}
              selectedAudioFile={selectedAudioFile}
              selectedClientName={selectedClientName}
              selectedOption={selectedOption}
              selectedOptionGroup={selectedOptionGroup}
              sessionTitle={sessionTitle}
              sessionTitleInputRef={sessionTitleInputRef}
              shouldSaveAudio={shouldSaveAudio}
              step={step}
              uploadDropAreaRef={uploadDropAreaRef}
              uploadFileDurationWarning={uploadFileDurationWarning}
              waveBarCount={waveBarCount}
              clientTriggerRef={clientTriggerRef}
              onAddClient={handleAddClient}
              onCancelRecording={handleCancelRecording}
              onOpenConsentHelpPage={openConsentHelpPage}
              onOpenFilePicker={openFilePicker}
              onRetryRecordingAfterError={retryRecordingAfterError}
              onSelectClient={handleSelectClient}
              onSelectOption={handleSelectOption}
              onInputTitleChange={setInputTitle}
              onSetWaveBarCount={setWaveBarCount}
              onRecordingNoteDraftChange={setRecordingNoteDraft}
              onSaveRecordingNote={saveRecordingNote}
              onToggleAudioSave={handleToggleAudioSave}
              onToggleClientDropdown={handleToggleClientDropdown}
              onToggleConsent={handleToggleConsent}
              onUpdateAudioDuration={setAudioDurationSeconds}
            />
          </MainContainer>
        </View>

        {showFooter ? (
          <View
            style={[
              step === 'recorded' ? styles.footerInline : styles.footerFloating,
              (isUploadStep && !isCompactUploadFooter) || isConsentStep ? styles.footerSplit : undefined,
              isCompactUploadFooter ? styles.footerStacked : undefined,
              isLimitedFooter ? styles.mobileFooterContainer : undefined,
            ]}
          >
            {isConsentStep && !limitedMode ? (
              <Pressable
                onPress={handleConsentBack}
                style={({ hovered, pressed }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  styles.footerButtonLeft,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  webTransitionSmooth,
                  hovered ? styles.footerButtonSecondaryHovered : undefined,
                  pressed ? styles.footerButtonSecondaryPressed : undefined,
                ]}
              >
                <Text isBold style={styles.footerButtonSecondaryText}>{limitedMode ? 'Annuleren' : 'Terug'}</Text>
              </Pressable>
            ) : null}
            {step === 'upload' ? (
              <Pressable
                onPress={openFilePicker}
                style={({ hovered }) => [
                  styles.footerButtonBase,
                  styles.footerButtonSecondary,
                  isCompactUploadFooter ? styles.footerButtonUploadTop : styles.footerButtonLeft,
                  isCompactFooter ? styles.footerButtonCompact : undefined,
                  hovered ? styles.footerButtonSecondaryHovered : undefined,
                ]}
              >
                <View style={styles.footerButtonContent}>
                  <FolderOpenIcon size={20} color={colors.textStrong} />
                  <Text isSemibold style={styles.footerButtonSecondaryText}>
                    Selecteer van computer
                  </Text>
                </View>
              </Pressable>
            ) : null}
            <View
              style={[
                styles.footerRightGroup,
                isCompactUploadFooter ? styles.footerRightGroupStacked : undefined,
                isUploadStep ? undefined : styles.footerRightGroupAlignEnd,
                isLimitedFooter ? styles.mobileFooterRightGroup : undefined,
              ]}
            >
              {isLimitedFooter ? (
                <>
                  <Pressable
                    disabled={isPrimaryActionDisabled}
                    onPress={handlePrimaryActionPress}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonPrimary,
                      styles.footerButtonRight,
                      styles.mobileFooterButtonBase,
                      styles.mobileFooterPrimaryButton,
                      isPrimaryActionDisabled ? styles.primaryButtonDisabled : undefined,
                      hovered && !isPrimaryActionDisabled ? styles.footerButtonPrimaryHovered : undefined,
                      pressed && !isPrimaryActionDisabled ? styles.footerButtonPrimaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={[styles.footerButtonPrimaryText, styles.mobileFooterButtonText]}>Doorgaan</Text>
                  </Pressable>
                  <Pressable
                    onPress={requestClose}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonSecondary,
                      styles.footerButtonLeft,
                      styles.cancelButtonNoBottomLeftRadius,
                      styles.mobileFooterButtonBase,
                      styles.mobileFooterSecondaryButton,
                      webTransitionSmooth,
                      hovered ? styles.footerButtonSecondaryHovered : undefined,
                      pressed ? styles.footerButtonSecondaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={[styles.footerButtonSecondaryText, styles.mobileFooterButtonText]}>Annuleren</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Pressable
                    onPress={requestClose}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonSecondary,
                      isUploadStep && !isCompactUploadFooter ? styles.footerButtonMiddle : styles.footerButtonLeft,
                      styles.cancelButtonNoBottomLeftRadius,
                      isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                      isCompactFooter ? styles.footerButtonCompact : undefined,
                      webTransitionSmooth,
                      hovered ? styles.footerButtonSecondaryHovered : undefined,
                      pressed ? styles.footerButtonSecondaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={styles.footerButtonSecondaryText}>Annuleren</Text>
                  </Pressable>
                  <Pressable
                    disabled={isPrimaryActionDisabled}
                    onPress={handlePrimaryActionPress}
                    style={({ hovered, pressed }) => [
                      styles.footerButtonBase,
                      styles.footerButtonPrimary,
                      styles.footerButtonRight,
                      isCompactUploadFooter ? styles.footerButtonStackedSplit : undefined,
                      isCompactFooter ? styles.footerButtonCompact : undefined,
                      isPrimaryActionDisabled ? styles.primaryButtonDisabled : undefined,
                      hovered && !isPrimaryActionDisabled ? styles.footerButtonPrimaryHovered : undefined,
                      pressed && !isPrimaryActionDisabled ? styles.footerButtonPrimaryPressed : undefined,
                    ]}
                  >
                    <Text isBold style={styles.footerButtonPrimaryText}>{step === 'recorded' ? 'Opslaan' : 'Doorgaan'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : null}
      </Animated.View>
      <InputWarningModals
        insufficientMinutesContext={insufficientMinutesContext}
        isInsufficientMinutesWarningVisible={isInsufficientMinutesWarningVisible}
        isRecordedCloseWarningVisible={isRecordedCloseWarningVisible}
        onCloseInsufficientMinutes={handleCloseInsufficientMinutes}
        onCloseRecordedWarning={handleCloseRecordedWarning}
        onConfirmRecordedDelete={handleConfirmRecordedDelete}
        onDownloadAudioForInsufficientMinutes={handleDownloadAudioForInsufficientMinutes}
        onOpenSubscriptionFromInsufficientMinutes={handleOpenSubscriptionFromInsufficientMinutes}
      />
    </View>
  )
}

