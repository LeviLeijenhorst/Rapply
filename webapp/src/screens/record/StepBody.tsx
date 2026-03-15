import React from 'react'
import { Animated, TextInput, View } from 'react-native'

import type { OptionKey } from './utils'
import type { NewInputStep } from './types'
import { SelectInputTypeStep } from './steps/SelectSessionTypeStep'
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
  editingRecordingNoteId: string | null
  recordingNoteDraft: string
  isRecordingTransitioning: boolean
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
  step: NewInputStep
  uploadDropAreaRef: React.RefObject<View | null>
  uploadFileDurationWarning: string | null
  waveBarCount: number
  clientTriggerRef: React.RefObject<any>
  onCancelRecording: () => void
  onOpenConsentHelpPage: () => void
  onOpenFilePicker: () => void
  onRetryRecordingAfterError: () => void
  onSelectClient: (clientId: string | null) => void
  onSelectOption: (option: OptionKey) => void
  onInputTitleChange: (title: string) => void
  onSetWaveBarCount: (count: number) => void
  onToggleClientDropdown: () => void
  onToggleConsent: () => void
  onRecordingNoteDraftChange: (value: string) => void
  onEditRecordingNote: (noteId: string) => void
  onDeleteRecordingNote: (noteId: string) => void
  onSaveRecordingNote: () => void
  onCancelEditingRecordingNote: () => void
  onStopRecording: () => void
}

export function StepBody({
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
  editingRecordingNoteId,
  recordingNoteDraft,
  isRecordingTransitioning,
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
  step,
  uploadDropAreaRef,
  uploadFileDurationWarning,
  waveBarCount,
  clientTriggerRef,
  onCancelRecording,
  onOpenConsentHelpPage,
  onOpenFilePicker,
  onRetryRecordingAfterError,
  onSelectClient,
  onSelectOption,
  onInputTitleChange,
  onSetWaveBarCount,
  onToggleClientDropdown,
  onToggleConsent,
  onRecordingNoteDraftChange,
  onEditRecordingNote,
  onDeleteRecordingNote,
  onSaveRecordingNote,
  onCancelEditingRecordingNote,
  onStopRecording,
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
    case 'recording_finishing':
    case 'recording_canceling':
      return (
        <RecordStep
          bars={bars}
          displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
          isTransitioning={isRecordingTransitioning}
          isRecordingPaused={isRecordingPaused}
          limitedMode={limitedMode}
          liveWaveHeights={liveWaveHeights}
          recordingNoteDraft={recordingNoteDraft}
          editingRecordingNoteId={editingRecordingNoteId}
          recordingNotes={recordingNotes}
          recordingNotesRevealProgress={recordingNotesRevealProgress}
          shouldRenderNotesPanel={shouldRenderRecordingNotesPanel}
          recorder={recorder}
          selectedClientName={selectedClientName}
          waveBarCount={waveBarCount}
          onCancelRecording={onCancelRecording}
          onRecordingNoteDraftChange={onRecordingNoteDraftChange}
          onEditRecordingNote={onEditRecordingNote}
          onDeleteRecordingNote={onDeleteRecordingNote}
          onRetryRecordingAfterError={onRetryRecordingAfterError}
          onSaveRecordingNote={onSaveRecordingNote}
          onCancelEditingRecordingNote={onCancelEditingRecordingNote}
          onSetWaveBarCount={onSetWaveBarCount}
          onStopRecording={onStopRecording}
        />
      )
    case 'recorded':
      return (
        <RecordedStep
          clientDropdownMaxHeight={clientDropdownMaxHeight}
          clientOptions={clientOptions}
          defaultDropdownMaxHeight={defaultDropdownMaxHeight}
          isClientOpen={isClientOpen}
          limitedMode={limitedMode}
          selectedClientName={selectedClientName}
          selectedOption={selectedOption}
          sessionTitle={sessionTitle}
          sessionTitleInputRef={sessionTitleInputRef}
          clientTriggerRef={clientTriggerRef}
          onSelectClient={onSelectClient}
          onInputTitleChange={onInputTitleChange}
          onToggleClientDropdown={onToggleClientDropdown}
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


