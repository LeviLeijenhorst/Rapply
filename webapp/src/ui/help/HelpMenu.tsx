import React from 'react'

import { PopoverMenu } from '../../ui/PopoverMenu'
import { HelpQuestionIcon } from '../../icons/HelpQuestionIcon'
import { FeedbackIcon } from '../../icons/FeedbackIcon'

type AnchorPoint = { x: number; y: number }

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onOpenHelpCenter: () => void
  onOpenFeedback: () => void
}

export function HelpMenu({ visible, anchorPoint, onClose, onOpenHelpCenter, onOpenFeedback }: Props) {
  const items = [
    {
      key: 'help-center',
      label: 'Help center',
      icon: <HelpQuestionIcon />,
      onPress: onOpenHelpCenter,
    },
    {
      key: 'feedback',
      label: 'Feedback geven',
      icon: <FeedbackIcon />,
      onPress: onOpenFeedback,
    },
  ]

  return <PopoverMenu visible={visible} anchorPoint={anchorPoint} placement="above" width={260} estimatedHeight={120} items={items} onClose={onClose} />
}

