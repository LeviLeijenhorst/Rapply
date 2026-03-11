export type NewSessionStep = 'select' | 'consent' | 'upload' | 'recording' | 'recorded'

export type NewSessionModalArgs = {
  visible: boolean
  onClose: () => void
  onRecordingBusyChange?: (isBusy: boolean) => void
  onOpenGeschrevenGespreksverslag: (coacheeId: string | null) => void
  onOpenMySubscription: () => void
  restoreDraftFromSubscriptionReturn?: boolean
  onRestoreDraftHandled?: () => void
  onOpenSession: (sessionId: string) => void
  onOpenNewCoachee: () => void
  initialCoacheeId?: string | null
  initialTrajectoryId?: string | null
  newlyCreatedCoacheeId?: string | null
  onNewlyCreatedCoacheeHandled: () => void
  limitedMode?: boolean
  initialOption?: 'gesprek' | 'gespreksverslag' | null
}
