import React from 'react'

import { PopoverMenu } from '../PopoverMenu'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { MijnAbonnementIcon } from '../icons/MijnAbonnementIcon'
import { DeelCoachScribeIcon } from '../icons/DeelCoachScribeIcon'
import { ContactIcon } from '../icons/ContactIcon'
import { PrivacyIcon } from '../icons/PrivacyIcon'
import { ArchiefMenuIcon } from '../icons/ArchiefMenuIcon'
import { SubscriptionBadgeIcon } from '../icons/SubscriptionBadgeIcon'

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
}: Props) {
  const items = [
    {
      key: 'account',
      label: 'Mijn account',
      icon: <MijnAccountIcon />,
      onPress: onOpenAccount,
    },
    {
      key: 'subscription',
      label: 'Mijn abonnement',
      badgeLabel: 'Basis',
      badgeIcon: <SubscriptionBadgeIcon />,
      icon: <MijnAbonnementIcon />,
      onPress: onOpenSubscription,
    },
    {
      key: 'archive',
      label: 'Archief',
      icon: <ArchiefMenuIcon />,
      onPress: onOpenArchive,
    },
    {
      key: 'contact',
      label: 'Contact',
      icon: <ContactIcon />,
      onPress: onOpenContact,
    },
    {
      key: 'share',
      label: 'Deel CoachScribe',
      icon: <DeelCoachScribeIcon />,
      onPress: onOpenShare,
    },
    {
      key: 'privacy',
      label: 'Privacy beleid',
      icon: <PrivacyIcon />,
      onPress: onOpenPrivacy,
    },
  ]

  return <PopoverMenu visible={visible} anchorPoint={anchorPoint} placement="above" width={320} estimatedHeight={320} items={items} onClose={onClose} />
}

