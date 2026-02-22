import React from 'react'

import { PopoverMenu } from '../PopoverMenu'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { DeelCoachScribeIcon } from '../icons/DeelCoachScribeIcon'
import { ContactIcon } from '../icons/ContactIcon'
import { PrivacyIcon } from '../icons/PrivacyIcon'
import { ArchiefMenuIcon } from '../icons/ArchiefMenuIcon'
import { MijnAbonnementIcon } from '../icons/MijnAbonnementIcon'
import { colors } from '../../theme/colors'

type AnchorPoint = { x: number; y: number }

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onOpenAccount: () => void
  onOpenSubscription: () => void
  onOpenArchive: () => void
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
  onOpenContact,
  onOpenShare,
  onOpenPrivacy,
  showSubscriptionItem = false,
}: Props) {
  const menuIconColor = colors.text

  const items = [
    {
      key: 'account',
      label: 'Mijn account',
      icon: <MijnAccountIcon color={menuIconColor} />,
      onPress: onOpenAccount,
    },
    ...(showSubscriptionItem
      ? [
          {
            key: 'subscription',
            label: 'Mijn abonnement',
            icon: <MijnAbonnementIcon color={menuIconColor} />,
            onPress: onOpenSubscription,
          },
        ]
      : []),
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
      icon: <ArchiefMenuIcon color={menuIconColor} />,
      onPress: onOpenArchive,
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

  return <PopoverMenu visible={visible} anchorPoint={anchorPoint} placement="above" width={320} estimatedHeight={420} items={items} onClose={onClose} />
}

