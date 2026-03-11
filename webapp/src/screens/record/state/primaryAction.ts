import type { OptionKey } from '../utils'
import type { NewSessionStep } from '../types'

type SessionKind = 'recording' | 'upload' | 'intake'

type CreateSessionFn = (
  values: { kind: 'recording' | 'upload' },
  options?: {
    sessionKind?: SessionKind
    overrideShouldSaveAudio?: boolean
    audioForTranscription?: { blob: Blob; mimeType: string }
    recordingDurationSeconds?: number | null
  },
) => Promise<boolean>

type Params = {
  hasRecordingConsent: boolean
  isPrimaryActionDisabled: boolean
  limitedMode: boolean
  selectedCoacheeId: string | null
  selectedCoacheeResolvedId: string | null
  selectedOption: OptionKey | null
  step: NewSessionStep
  createAndOpenSession: CreateSessionFn
  handleClose: () => void
  onOpenGeschrevenGespreksverslag: (coacheeId: string | null) => void
  saveSelectedFileToAudioStore: () => Promise<void>
  setHasRecordingConsent: (value: boolean) => void
  setStep: (step: NewSessionStep) => void
  clearSubscriptionReturnDraft: () => Promise<void>
}

// Centralized footer primary action branching to keep modal rendering readable.
export function runPrimaryFooterAction(params: Params) {
  if (params.isPrimaryActionDisabled) return

  if (params.step === 'recorded') {
    if (params.selectedOption === 'upload') {
      void params.createAndOpenSession({ kind: 'upload' })
      return
    }
    if (params.selectedOption === 'gesprek' || params.selectedOption === 'gespreksverslag' || params.selectedOption === 'intake') {
      void params.createAndOpenSession(
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
    if (!params.limitedMode && params.selectedOption === 'upload') {
      params.setStep('upload')
      return
    }
    params.setStep('recording')
    return
  }

  if (!params.selectedOption) return

  if (params.selectedOption === 'schrijven') {
    params.onOpenGeschrevenGespreksverslag(params.selectedCoacheeResolvedId ?? params.selectedCoacheeId ?? null)
    void params.clearSubscriptionReturnDraft()
    params.handleClose()
    return
  }

  if (params.selectedOption === 'gespreksverslag') {
    params.setStep('recording')
    return
  }

  params.setHasRecordingConsent(false)
  params.setStep('consent')
}




