import React from 'react'

import { WarningModal } from '../../../ui/modals/WarningModal'

type Props = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmChatClearModal({ visible, onClose, onConfirm }: Props) {
  if (!visible) return null

  return (
    <WarningModal
      visible={visible}
      title="Chat wissen"
      description="Weet je zeker dat je deze chat wilt wissen? Dit kan niet ongedaan worden gemaakt."
      confirmLabel="Wissen"
      cancelLabel="Annuleren"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}

