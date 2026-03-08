import React from 'react'
import { Animated, TextInput, View } from 'react-native'

import type { OptionKey } from './newInputModalUtils'
import type { NewSessionStep } from './newInputModalTypes'
import { SelectSessionTypeStep } from './steps/SelectSessionTypeStep'
import { UploadAudioStep } from './steps/UploadAudioStep'
import { RecordingStep } from './steps/RecordingStep'
import { RecordedStep } from './steps/RecordedStep'
import { ConsentStep } from './steps/ConsentStep'

type RecorderState = {
  status: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopping' | 'ready' | 'error'
  stop: () => void
  pause: () => void
  resume: () => void
}

type Props = {
  audioDurationSeconds: number | null
  audioPreviewUrl: string | null
  bars: number[]
  coacheeDropdownMaxHeight: number | null
  coacheeOptions: Array<{ id: string | null; name: string }>
  defaultDropdownMaxHeight: number
  displayedRecordingElapsedSeconds: number
  gesprekOptionLabel: string
  gespreksverslagOptionLabel: string
  hasRecordingConsent: boolean
  isCoacheeOpen: boolean
  isCompactConsent: boolean
  isRecordingPaused: boolean
  isUploadDragActive: boolean
  recordingNotes: Array<{ id: string; seconds: number; text: string }>
  recordingNoteDraft: string
  limitedMode: boolean
  liveWaveHeights: number[]
  recorder: RecorderState
  recordingExpandProgress: Animated.Value
  recordingNotesRevealProgress: Animated.Value
  shouldRenderRecordingNotesPanel: boolean
  selectedCoacheeName: string | null
  selectedAudioFile: File | null
  selectedOption: OptionKey | null
  selectedOptionGroup: 'gesprek' | 'gespreksverslag' | null
  sessionTitle: string
  sessionTitleInputRef: React.RefObject<TextInput | null>
  shouldSaveAudio: boolean
  step: NewSessionStep
  uploadDropAreaRef: React.RefObject<View | null>
  uploadFileDurationWarning: string | null
  waveBarCount: number
  coacheeTriggerRef: React.RefObject<any>
  onAddCoachee: () => void
  onCancelRecording: () => void
  onOpenConsentHelpPage: () => void
  onOpenFilePicker: () => void
  onRetryRecordingAfterError: () => void
  onSelectCoachee: (coacheeId: string | null) => void
  onSelectOption: (option: OptionKey) => void
  onSessionTitleChange: (title: string) => void
  onSetWaveBarCount: (count: number) => void
  onToggleAudioSave: () => void
  onToggleCoacheeDropdown: () => void
  onToggleConsent: () => void
  onUpdateAudioDuration: (seconds: number | null) => void
  onRecordingNoteDraftChange: (value: string) => void
  onSaveRecordingNote: () => void
}

export function NewSessionStepBody({
  audioDurationSeconds,
  audioPreviewUrl,
  bars,
  coacheeDropdownMaxHeight,
  coacheeOptions,
  defaultDropdownMaxHeight,
  displayedRecordingElapsedSeconds,
  gesprekOptionLabel,
  gespreksverslagOptionLabel,
  hasRecordingConsent,
  isCoacheeOpen,
  isCompactConsent,
  isRecordingPaused,
  isUploadDragActive,
  recordingNotes,
  recordingNoteDraft,
  limitedMode,
  liveWaveHeights,
  recorder,
  recordingExpandProgress,
  recordingNotesRevealProgress,
  shouldRenderRecordingNotesPanel,
  selectedCoacheeName,
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
  coacheeTriggerRef,
  onAddCoachee,
  onCancelRecording,
  onOpenConsentHelpPage,
  onOpenFilePicker,
  onRetryRecordingAfterError,
  onSelectCoachee,
  onSelectOption,
  onSessionTitleChange,
  onSetWaveBarCount,
  onToggleAudioSave,
  onToggleCoacheeDropdown,
  onToggleConsent,
  onUpdateAudioDuration,
  onRecordingNoteDraftChange,
  onSaveRecordingNote,
}: Props) {
  switch (step) {
    case 'select':
      return (
        <SelectSessionTypeStep
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
        <RecordingStep
          bars={bars}
          displayedRecordingElapsedSeconds={displayedRecordingElapsedSeconds}
          isRecordingPaused={isRecordingPaused}
          limitedMode={limitedMode}
          liveWaveHeights={liveWaveHeights}
          recordingNoteDraft={recordingNoteDraft}
          recordingNotes={recordingNotes}
          recordingExpandProgress={recordingExpandProgress}
          recordingNotesRevealProgress={recordingNotesRevealProgress}
          shouldRenderNotesPanel={shouldRenderRecordingNotesPanel}
          recorder={recorder}
          selectedCoacheeName={selectedCoacheeName}
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
          coacheeDropdownMaxHeight={coacheeDropdownMaxHeight}
          coacheeOptions={coacheeOptions}
          defaultDropdownMaxHeight={defaultDropdownMaxHeight}
          isCoacheeOpen={isCoacheeOpen}
          limitedMode={limitedMode}
          selectedCoacheeName={selectedCoacheeName}
          selectedOption={selectedOption}
          sessionTitle={sessionTitle}
          sessionTitleInputRef={sessionTitleInputRef}
          shouldSaveAudio={shouldSaveAudio}
          coacheeTriggerRef={coacheeTriggerRef}
          onAddCoachee={onAddCoachee}
          onSelectCoachee={onSelectCoachee}
          onSessionTitleChange={onSessionTitleChange}
          onToggleAudioSave={onToggleAudioSave}
          onToggleCoacheeDropdown={onToggleCoacheeDropdown}
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

