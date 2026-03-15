import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { MonitorIcon } from '../../../icons/MonitorIcon'
import { MicrophoneSmallIcon } from '../../../icons/MicrophoneSmallIcon'
import { Mp3UploadIcon } from '../../../icons/Mp3UploadIcon'
import { colors } from '../../../design/theme/colors'
import { InputOptionRow } from '../components/InputOptionRow'
import { styles } from '../styles'
import type { OptionKey } from '../utils'

type SelectInputTypeStepModel = {
  limitedMode: boolean
  gesprekOptionLabel: string
  gespreksverslagOptionLabel: string
  onSelectOption: (option: OptionKey) => void
  selectedOption: OptionKey | null
  selectedOptionGroup: 'gesprek' | 'gespreksverslag' | null
}

export function SelectInputTypeStep({
  limitedMode,
  gesprekOptionLabel,
  gespreksverslagOptionLabel,
  onSelectOption,
  selectedOption,
  selectedOptionGroup: _selectedOptionGroup,
}: SelectInputTypeStepModel) {
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
        <InputOptionRow
          label={gesprekOptionLabel}
          isSelected={selectedOption === 'gesprek'}
          onPress={() => onSelectOption('gesprek')}
          leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
        />
        <InputOptionRow
          label={gespreksverslagOptionLabel}
          isSelected={selectedOption === 'gespreksverslag'}
          onPress={() => onSelectOption('gespreksverslag')}
          leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
        />
        <InputOptionRow
          label="Gespreksverslag schrijven"
          isSelected={selectedOption === 'schrijven'}
          onPress={() => onSelectOption('schrijven')}
          leftIcon={<MicrophoneSmallIcon color={colors.textStrong} size={20} />}
        />
        <InputOptionRow
          label="Audio bestanden uploaden"
          isSelected={selectedOption === 'upload_audio'}
          onPress={() => onSelectOption('upload_audio')}
          leftIcon={<Mp3UploadIcon />}
        />
        <InputOptionRow
          label="Andere bestanden uploaden"
          isSelected={selectedOption === 'upload_document'}
          onPress={() => onSelectOption('upload_document')}
          leftIcon={<Mp3UploadIcon />}
        />
      </View>
    </ScrollView>
  )
}





