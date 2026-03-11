export type NewInputStep = 'select' | 'consent' | 'upload' | 'recording' | 'recorded'

export type NewInputModalArgs = {
  visible: boolean
  onClose: () => void
  onRecordingBusyChange?: (isBusy: boolean) => void
  onOpenGeschrevenGespreksverslag: (clientId: string | null) => void
  onOpenMySubscription: () => void
  restoreDraftFromSubscriptionReturn?: boolean
  onRestoreDraftHandled?: () => void
  onOpenInput: (sessionId: string) => void
  onOpenNewClient: () => void
  initialClientId?: string | null
  initialTrajectoryId?: string | null
  newlyCreatedClientId?: string | null
  onNewlyCreatedClientHandled: () => void
  limitedMode?: boolean
  initialOption?: 'gesprek' | 'gespreksverslag' | null
}

