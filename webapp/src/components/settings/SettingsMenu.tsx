import React from 'react'

import { PopoverMenu } from '../PopoverMenu'
import { MijnAccountIcon } from '../icons/MijnAccountIcon'
import { DeelCoachScribeIcon } from '../icons/DeelCoachScribeIcon'
import { ContactIcon } from '../icons/ContactIcon'
import { PrivacyIcon } from '../icons/PrivacyIcon'
import { ArchiefMenuIcon } from '../icons/ArchiefMenuIcon'
import { colors } from '../../theme/colors'

type AnchorPoint = { x: number; y: number }

type Props = {
  visible: boolean
  anchorPoint: AnchorPoint | null
  onClose: () => void
  onOpenAccount: () => void
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
  onOpenArchive,
  onOpenContact,
  onOpenShare,
  onOpenPrivacy,
}: Props) {
  const menuIconColor = colors.textSecondary

  const items = [
    {
      key: 'account',
      label: 'Mijn account',
      icon: <MijnAccountIcon color={menuIconColor} />,
      onPress: onOpenAccount,
    },
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

  return <PopoverMenu visible={visible} anchorPoint={anchorPoint} placement="above" width={320} estimatedHeight={360} items={items} onClose={onClose} />
}

