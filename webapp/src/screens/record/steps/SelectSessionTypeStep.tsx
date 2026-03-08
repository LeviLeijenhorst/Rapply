import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../ui/CoachscribeLogo'
import { MonitorIcon } from '../../../icons/MonitorIcon'
import { MicrophoneSmallIcon } from '../../../icons/MicrophoneSmallIcon'
import { Mp3UploadIcon } from '../../../icons/Mp3UploadIcon'
import { colors } from '../../../design/theme/colors'
import { SessionOptionRow } from '../components/SessionOptionRow'
import { styles } from '../newInputModalStyles'
import type { OptionKey } from '../newInputModalUtils'

type Props = {
  limitedMode: boolean
  gesprekOptionLabel: string
  gespreksverslagOptionLabel: string
  onSelectOption: (option: OptionKey) => void
  selectedOption: OptionKey | null
  selectedOptionGroup: 'gesprek' | 'gespreksverslag' | null
}

export function SelectSessionTypeStep({
  limitedMode,
  gesprekOptionLabel,
  gespreksverslagOptionLabel,
  onSelectOption,
  selectedOption,
  selectedOptionGroup,
}: Props) {
  if (limitedMode) {
    return (
      <View style={styles.mobileSelectBody}>
        <View style={styles.mobileTopBrand}>
          <CoachscribeLogo />
        </View>
        <View style={styles.mobileSelectInfo}>
          <View style={styles.mobileSelectMonitor}>
            <MonitorIcon size={34} />
          </View>
          <Text isBold style={styles.mobileSelectDesktopText}>
            Gebruik de desktop versie{"\n"}voor alle functies
          </Text>
        </View>
        <View style={styles.mobileSelectIllustrationWrap}>
          <View style={styles.mobileSelectIllustrationCircle} />
          <Image
            source={require('../../../../assets/mobile-limited/desktop-illustration.png')}
            resizeMode="contain"
            style={styles.mobileSelectIllustrationImage as any}
          />
        </View>
        <View style={styles.mobileSelectButtons}>
          <Pressable
            onPress={() => onSelectOption('gesprek')}
            style={({ hovered }) => [styles.mobilePrimaryButton, hovered ? styles.mobilePrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobilePrimaryButtonText}>Gesprek opnemen</Text>
          </Pressable>
          <Pressable
            onPress={() => onSelectOption('gespreksverslag')}
            style={({ hovered }) => [styles.mobilePrimaryButton, hovered ? styles.mobilePrimaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.mobilePrimaryButtonText}>Verslag opnemen</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.stepScroll}
      contentContainerStyle={[styles.stepScrollContent, styles.stepScrollContentSelect]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.selectList}>
        <SessionOptionRow
          label={gesprekOptionLabel}
          isSelected={selectedOptionGroup === 'gesprek'}
          onPress={() => onSelectOption('gesprek')}
          leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
        />
        <SessionOptionRow
          label={gespreksverslagOptionLabel}
          isSelected={selectedOptionGroup === 'gespreksverslag'}
          onPress={() => onSelectOption('gespreksverslag')}
          leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
        />
        <SessionOptionRow
          label="Bestand uploaden"
          isSelected={selectedOption === 'upload'}
          onPress={() => onSelectOption('upload')}
          leftIcon={<Mp3UploadIcon />}
        />
      </View>
    </ScrollView>
  )
}




