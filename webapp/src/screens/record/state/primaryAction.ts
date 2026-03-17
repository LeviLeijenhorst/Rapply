import type { OptionKey } from '../utils'
import type { NewInputStep } from '../types'

type InputKind = 'recording' | 'upload' | 'intake'

type CreateInputFn = (
  values: { kind: 'recording' | 'upload' | 'written' },
  options?: {
    sessionKind?: InputKind
    overrideShouldSaveAudio?: boolean
    audioForTranscription?: { blob: Blob; mimeType: string }
    recordingDurationSeconds?: number | null
  },
) => Promise<boolean>

type Params = {
  hasRecordingConsent: boolean
  isRecordingTransitioning: boolean
  isPrimaryActionDisabled: boolean
  limitedMode: boolean
  selectedClientId: string | null
  selectedClientResolvedId: string | null
  selectedOption: OptionKey | null
  step: NewInputStep
  createAndOpenInput: CreateInputFn
  createAndOpenWrittenInput: () => Promise<boolean>
  handleClose: () => void
  onOpenGeschrevenGespreksverslag: (clientId: string | null) => void
  saveSelectedFileToAudioStore: () => Promise<void>
  setHasRecordingConsent: (value: boolean) => void
  setStep: (step: NewInputStep) => void
  clearSubscriptionReturnDraft: () => Promise<void>
}

// Centralized footer primary action branching to keep modal rendering readable.
export function runPrimaryFooterAction(params: Params) {
  if (params.isPrimaryActionDisabled || params.isRecordingTransitioning) return

  if (params.step === 'recorded') {
    if (params.selectedOption === 'upload_audio' || params.selectedOption === 'upload_document') {
      void params.createAndOpenInput({ kind: 'upload' })
      return
    }
    if (
      params.selectedOption === 'gesprek' ||
      params.selectedOption === 'gespreksverslag' ||
      params.selectedOption === 'record-video' ||
      params.selectedOption === 'intake'
    ) {
      void params.createAndOpenInput(
        { kind: 'recording' },
        params.selectedOption === 'intake' ? { sessionKind: 'intake' } : undefined,
      )
    }
    return
  }

  if (params.step === 'upload') {
    if (!params.limitedMode) {
      void params.saveSelectedFileToAudioStore()
    }
    return
  }

  if (params.step === 'consent') {
    if (!params.selectedOption || !params.hasRecordingConsent) return
    if (!params.limitedMode && (params.selectedOption === 'upload_audio' || params.selectedOption === 'upload_document')) {
      params.setStep('upload')
      return
    }
    params.setStep('recording')
    return
  }

  if (!params.selectedOption) return

  if (params.selectedOption === 'upload_audio' || params.selectedOption === 'upload_document') {
    params.setStep('upload')
    return
  }

  if (params.selectedOption === 'schrijven') {
    void params.createAndOpenWrittenInput()
    return
  }

  if (params.selectedOption === 'gespreksverslag') {
    params.setStep('recording')
    return
  }

  if (params.selectedOption === 'record-video') {
    params.setStep('recording')
    return
  }

  params.setHasRecordingConsent(false)
  params.setStep('consent')
}





