export type NewInputStep = 'select' | 'consent' | 'upload' | 'recording' | 'recording_finishing' | 'recording_canceling' | 'recorded'

export type NewInputQuickAction =
  | 'record-session'
  | 'record-summary'
  | 'write-report'
  | 'record-video'
  | 'import-audio'
  | 'import-document'

export type NewInputModalArgs = {
  visible: boolean
  onClose: () => void
  onRecordingBusyChange?: (isBusy: boolean) => void
  onOpenGeschrevenGespreksverslag: (clientId: string | null) => void
  onOpenMySubscription: (params?: { returnClientId?: string | null }) => void
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
  initialQuickAction?: NewInputQuickAction | null
}
