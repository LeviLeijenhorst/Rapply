import React from 'react'

import { ConfirmDeleteDialog } from '../../../ui/modals/ConfirmDeleteDialog'

type Props = {
  visible: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmChatClearModal({ visible, onClose, onConfirm }: Props) {
  if (!visible) return null

  return (
    <ConfirmDeleteDialog
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

