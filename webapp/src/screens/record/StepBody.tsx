import React from 'react'
import { Animated, TextInput, View } from 'react-native'

import type { OptionKey } from './utils'
import type { NewInputStep } from './types'
import { SelectInputTypeStep } from './steps/SelectInputTypeStep'
import { UploadAudioStep } from './steps/UploadAudioStep'
import { RecordStep } from './steps/RecordStep'
import { RecordedStep } from './steps/RecordedStep'
import { ConsentStep } from './steps/ConsentStep'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  stop: () => void
  pause: () => void
  resume: () => void
}

type StepBodyModel = {
  audioDurationSeconds: number | null
  audioPreviewUrl: string | null
  bars: number[]
  clientDropdownMaxHeight: number | null
  clientOptions: Array<{ id: string | null; name: string }>
  defaultDropdownMaxHeight: number
  displayedRecordingElapsedSeconds: number
  gesprekOptionLabel: string
  gespreksverslagOptionLabel: string
  hasRecordingConsent: boolean
  isClientOpen: boolean
  isCompactConsent: boolean
  isRecordingPaused: boolean
  isUploadDragActive: boolean
  recordingNotes: Array<{ id: string; seconds: number; text: string }>
  recordingNoteDraft: string
  limitedMode: boolean
  liveWaveHeights: number[]
  recorder: RecorderState
  recordingNotesRevealProgress: Animated.Value
  shouldRenderRecordingNotesPanel: boolean
  selectedClientName: string | null
  selectedAudioFile: File | null
  selectedOption: OptionKey | null
  selectedOptionGroup: 'gesprek' | 'gespreksverslag' | null
  sessionTitle: string
  sessionTitleInputRef: React.RefObject<TextInput | null>
  shouldSaveAudio: boolean
  step: NewInputStep
  uploadDropAreaRef: React.RefObject<View | null>
  uploadFileDurationWarning: string | null
  waveBarCount: number
  clientTriggerRef: React.RefObject<any>
  onAddClient: () => void
  onCancelRecording: () => void
  onOpenConsentHelpPage: () => void
  onOpenFilePicker: () => void
  onRetryRecordingAfterError: () => void
  onSelectClient: (clientId: string | null) => void
  onSelectOption: (option: OptionKey) => void
  onInputTitleChange: (title: string) => void
  onSetWaveBarCount: (count: number) => void
  onToggleAudioSave: () => void
  onToggleClientDropdown: () => void
  onToggleConsent: () => void
  onUpdateAudioDuration: (seconds: number | null) => void
  onRecordingNoteDraftChange: (value: string) => void
  onSaveRecordingNote: () => void
}

export function StepBody({
  audioDurationSeconds,
  audioPreviewUrl,
  bars,
  clientDropdownMaxHeight,
  clientOptions,
  defaultDropdownMaxHeight,
  displayedRecordingElapsedSeconds,
  gesprekOptionLabel,
  gespreksverslagOptionLabel,
  hasRecordingConsent,
  isClientOpen,
  isCompactConsent,
  isRecordingPaused,
  isUploadDragActive,
  recordingNotes,
  recordingNoteDraft,
  limitedMode,
  liveWaveHeights,
  recorder,
  recordingNotesRevealProgress,
  shouldRenderRecordingNotesPanel,
  selectedClientName,
  selectedAudioFile,
  selectedOption,
  selectedOptionGroup,
  sessionTitle,
  sessionTitleInputRef,
  shouldSaveAudio,
  step,
  uploadDropAreaRef,
  uploadFileDurationWarning,
  waveBarCount,
  clientTriggerRef,
  onAddClient,
  onCancelRecording,
  onOpenConsentHelpPage,
  onOpenFilePicker,
  onRetryRecordingAfterError,
  onSelectClient,
  onSelectOption,
  onInputTitleChange,
  onSetWaveBarCount,
  onToggleAudioSave,
  onToggleClientDropdown,
  onToggleConsent,
  onUpdateAudioDuration,
  onRecordingNoteDraftChange,
  onSaveRecordingNote,
}: StepBodyModel) {
  switch (step) {
    case 'select':
      return (
        <SelectInputTypeStep
          limitedMode={limitedMode}
          gesprekOptionLabel={gesprekOptionLabel}
          gespreksverslagOptionLabel={gespreksverslagOptionLabel}
          onSelectOption={onSelectOption}
          selectedOption={selectedOption}
          selectedOptionGroup={selectedOptionGroup}
        />
      )
    case 'upload':
      return (
        <UploadAudioStep
          isUploadDragActive={isUploadDragActive}
          selectedAudioFile={selectedAudioFile}
          uploadDropAreaRef={uploadDropAreaRef}
          uploadFileDurationWarning={uploadFileDurationWarning}
          onOpenFilePicker={onOpenFilePicker}
        />
      )
    case 'recording':
      return (
        <RecordStep
          bars={bars}
          displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
          isRecordingPaused={isRecordingPaused}
          limitedMode={limitedMode}
          liveWaveHeights={liveWaveHeights}
          recordingNoteDraft={recordingNoteDraft}
          recordingNotes={recordingNotes}
          recordingNotesRevealProgress={recordingNotesRevealProgress}
          shouldRenderNotesPanel={shouldRenderRecordingNotesPanel}
          recorder={recorder}
          selectedClientName={selectedClientName}
          waveBarCount={waveBarCount}
          onCancelRecording={onCancelRecording}
          onRecordingNoteDraftChange={onRecordingNoteDraftChange}
          onRetryRecordingAfterError={onRetryRecordingAfterError}
          onSaveRecordingNote={onSaveRecordingNote}
          onSetWaveBarCount={onSetWaveBarCount}
        />
      )
    case 'recorded':
      return (
        <RecordedStep
          audioDurationSeconds={audioDurationSeconds}
          audioPreviewUrl={audioPreviewUrl}
          clientDropdownMaxHeight={clientDropdownMaxHeight}
          clientOptions={clientOptions}
          defaultDropdownMaxHeight={defaultDropdownMaxHeight}
          isClientOpen={isClientOpen}
          limitedMode={limitedMode}
          selectedClientName={selectedClientName}
          selectedOption={selectedOption}
          sessionTitle={sessionTitle}
          sessionTitleInputRef={sessionTitleInputRef}
          shouldSaveAudio={shouldSaveAudio}
          clientTriggerRef={clientTriggerRef}
          onAddClient={onAddClient}
          onSelectClient={onSelectClient}
          onInputTitleChange={onInputTitleChange}
          onToggleAudioSave={onToggleAudioSave}
          onToggleClientDropdown={onToggleClientDropdown}
          onUpdateAudioDuration={onUpdateAudioDuration}
        />
      )
    case 'consent':
      return (
        <ConsentStep
          hasRecordingConsent={hasRecordingConsent}
          isCompactConsent={isCompactConsent}
          limitedMode={limitedMode}
          onOpenConsentHelpPage={onOpenConsentHelpPage}
          onToggleConsent={onToggleConsent}
        />
      )
    default:
      return null
  }
}


