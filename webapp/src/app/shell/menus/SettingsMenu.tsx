import React from 'react'

import { ActionMenu } from '../../../ui/overlays/ActionMenu'
import { DeelRapplyIcon } from '../../../icons/DeelRapplyIcon'
import { PrivacyIcon } from '../../../icons/PrivacyIcon'
import { FeedbackIcon } from '../../../icons/FeedbackIcon'
import { ContactIcon } from '../../../icons/ContactIcon'
import { colors } from '../../../design/theme/colors'

type AnchorPoint = { x: number; y: number }

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onOpenSubscription: () => void
  onOpenFeedback: () => void
  onOpenContact: () => void
  onOpenShare: () => void
  onOpenPrivacy: () => void
  showSubscriptionItem?: boolean
}

export function SettingsMenu({
  visible,
  anchorPoint,
  onClose,
  onOpenSubscription,
  onOpenFeedback,
  onOpenContact,
  onOpenShare,
  onOpenPrivacy,
  showSubscriptionItem = false,
}: Props) {
  const menuIconColor = colors.text
  void onOpenSubscription
  void showSubscriptionItem

  const items = [
    {
      key: 'feedback',
      label: 'Feedback',
      icon: <FeedbackIcon color={menuIconColor} />,
      onPress: onOpenFeedback,
    },
    {
      key: 'contact',
      label: 'Contact',
      icon: <ContactIcon color={menuIconColor} />,
      onPress: onOpenContact,
    },
    {
      key: 'share',
      label: 'Deel Rapply',
      icon: <DeelRapplyIcon color={menuIconColor} />,
      onPress: onOpenShare,
    },
    {
      key: 'privacy',
      label: 'Privacy beleid',
      icon: <PrivacyIcon color={menuIconColor} />,
      onPress: onOpenPrivacy,
    },
  ]

  return <ActionMenu visible={visible} anchorPoint={anchorPoint} placement="above" width={320} estimatedHeight={420} items={items} onClose={onClose} />
}


