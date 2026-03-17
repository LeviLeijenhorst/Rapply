import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { MonitorIcon } from '../../../icons/MonitorIcon'
import { ClientPageMicrophoneIcon } from '../../../icons/ClientPageSvgIcons'
import { ImportAudioIcon } from '../../../icons/ImportAudioIcon'
import { ImportDocumentIcon } from '../../../icons/ImportDocumentIcon'
import { RecordSummaryIcon } from '../../../icons/RecordSummaryIcon'
import { RecordVideoCallIcon } from '../../../icons/RecordVideoCallIcon'
import { VerslagSchrijvenIcon } from '../../../icons/VerslagSchrijvenIcon'
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
          subtitle="Neem een volledige sessie op"
          isSelected={selectedOption === 'gesprek'}
          onPress={() => onSelectOption('gesprek')}
          leftIcon={<ClientPageMicrophoneIcon size={18} />}
          iconAccentFrom="#6E22B7"
          iconAccentTo="#8E32E8"
        />
        <InputOptionRow
          label={gespreksverslagOptionLabel}
          subtitle="Maak een spraakopname over een sessie"
          isSelected={selectedOption === 'gespreksverslag'}
          onPress={() => onSelectOption('gespreksverslag')}
          leftIcon={<RecordSummaryIcon size={18} />}
          iconAccentFrom="#1B4EC2"
          iconAccentTo="#2A6DFF"
        />
        <InputOptionRow
          label="Gespreksverslag schrijven"
          subtitle="Werk je verslag handmatig uit"
          isSelected={selectedOption === 'schrijven'}
          onPress={() => onSelectOption('schrijven')}
          leftIcon={<VerslagSchrijvenIcon size={18} color="#FFFFFF" />}
          iconAccentFrom="#0F7E3A"
          iconAccentTo="#1CB95C"
        />
        <InputOptionRow
          label="Record video call"
          subtitle="Neem een videocall op in je browser"
          isSelected={selectedOption === 'record-video'}
          onPress={() => onSelectOption('record-video')}
          leftIcon={<RecordVideoCallIcon size={18} />}
          iconAccentFrom="#0F7E3A"
          iconAccentTo="#1CB95C"
        />
        <InputOptionRow
          label="Audio bestanden uploaden"
          subtitle="Selecteer een audio file van je computer"
          isSelected={selectedOption === 'upload_audio'}
          onPress={() => onSelectOption('upload_audio')}
          leftIcon={<ImportAudioIcon size={18} />}
          iconAccentFrom="#C75D10"
          iconAccentTo="#F1852F"
        />
        <InputOptionRow
          label="Andere bestanden uploaden"
          subtitle="Selecteer een document van je computer"
          isSelected={selectedOption === 'upload_document'}
          onPress={() => onSelectOption('upload_document')}
          leftIcon={<ImportDocumentIcon size={18} />}
          iconAccentFrom="#9C0154"
          iconAccentTo="#D51477"
        />
      </View>
    </ScrollView>
  )
}





