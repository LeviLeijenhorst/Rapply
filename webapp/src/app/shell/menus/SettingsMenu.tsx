import React from 'react'

import { ActionMenu } from '../../../ui/overlays/ActionMenu'
import { MijnAccountIcon } from '../../../icons/MijnAccountIcon'
import { DeelCoachScribeIcon } from '../../../icons/DeelCoachScribeIcon'
import { PrivacyIcon } from '../../../icons/PrivacyIcon'
import { ArchiefMenuIcon } from '../../../icons/ArchiefMenuIcon'
import { FeedbackIcon } from '../../../icons/FeedbackIcon'
import { ContactIcon } from '../../../icons/ContactIcon'
import { colors } from '../../../design/theme/colors'

type AnchorPoint = { x: number; y: number }

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onOpenAccount: () => void
  onOpenSubscription: () => void
  onOpenArchive: () => void
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
  onOpenAccount,
  onOpenSubscription,
  onOpenArchive,
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
      key: 'account',
      label: 'Account',
      icon: <MijnAccountIcon color={menuIconColor} />,
      onPress: onOpenAccount,
    },
    // Tijdelijk uitgezet:
    // ...(showSubscriptionItem
    //   ? [
    //       {
    //         key: 'subscription',
    //         label: 'Mijn abonnement',
    //         icon: <MijnAbonnementIcon color={menuIconColor} />,
    //         onPress: onOpenSubscription,
    //       },
    //     ]
    //   : []),
    // {
    //   key: 'theme',
    //   label: 'Donkere modus',
    //   icon: <SettingsIcon color={menuIconColor} size={18} />,
    //   badgeLabel: themeBadgeLabel,
    //   onPress: () => {
    //     toggleMode()
    //     onClose()
    //   },
    // },
    {
      key: 'archive',
      label: 'Archief',
      icon: <ArchiefMenuIcon color={menuIconColor} strokeWidth={1.25} />,
      onPress: onOpenArchive,
    },
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
      label: 'Deel CoachScribe',
      icon: <DeelCoachScribeIcon color={menuIconColor} />,
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


