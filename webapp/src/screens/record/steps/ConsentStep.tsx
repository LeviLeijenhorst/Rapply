import React from 'react'
import { Image, Pressable, ScrollView, View } from 'react-native'

import { Text } from '../../../ui/Text'
import { CoachscribeLogo } from '../../../components/brand/CoachscribeLogo'
import { CheckmarkIcon } from '../../../icons/CheckmarkIcon'
import { MicrophoneSmallIcon } from '../../../icons/MicrophoneSmallIcon'
import { colors } from '../../../design/theme/colors'
import { styles } from '../styles'

type ConsentStepModel = {
  hasRecordingConsent: boolean
  isCompactConsent: boolean
  limitedMode: boolean
  onOpenConsentHelpPage: () => void
  onToggleConsent: () => void
}

export function ConsentStep({
  hasRecordingConsent,
  isCompactConsent,
  limitedMode,
  onOpenConsentHelpPage,
  onToggleConsent,
}: ConsentStepModel) {
  if (limitedMode) {
    return (
      <View style={styles.mobileConsentBody}>
        <View style={styles.mobileConsentBrand}>
          <CoachscribeLogo />
        </View>
        <View style={styles.mobileConsentSpacer} />
        <View style={styles.mobileConsentCenter}>
          <Image
            source={require('../../../../assets/mobile-limited/consent-illustration.png')}
            resizeMode="contain"
            style={styles.mobileConsentIllustration as any}
          />
          <Pressable onPress={onToggleConsent} style={styles.mobileConsentCheckboxRow}>
            <View style={[styles.consentCheckbox, hasRecordingConsent ? styles.consentCheckboxChecked : undefined]}>
              {hasRecordingConsent ? <CheckmarkIcon color={colors.selected} width={14} height={12} /> : null}
            </View>
            <Text style={styles.mobileConsentCheckboxLabel}>
              De cliënt gaat ermee akkoord dat de sessie wordt opgenomen
            </Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.stepScroll} contentContainerStyle={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.consentBody}>
        <View style={styles.consentIconCircle}>
          <MicrophoneSmallIcon color={colors.textStrong} size={28} />
        </View>
        <Text isBold style={[styles.consentTitle, isCompactConsent ? styles.consentTitleCompact : undefined]}>
          Ik heb expliciete toestemming van mijn cliënt
        </Text>
        <Text style={[styles.consentDescription, isCompactConsent ? styles.consentDescriptionCompact : undefined]}>
          Door verder te gaan bevestig je dat alle deelnemers vooraf zijn geïnformeerd over de opname en vrijwillig toestemming hebben gegeven.
        </Text>
        <Pressable
          onPress={onToggleConsent}
          style={({ hovered }) => [styles.consentCheckboxRow, hovered ? styles.consentCheckboxRowHovered : undefined]}
        >
          <View style={[styles.consentCheckbox, hasRecordingConsent ? styles.consentCheckboxChecked : undefined]}>
            {hasRecordingConsent ? <CheckmarkIcon color={colors.selected} width={14} height={12} /> : null}
          </View>
          <Text style={styles.consentCheckboxLabel}>
            Ik bevestig dat ik toestemming heb.
          </Text>
        </Pressable>
        <Pressable
          onPress={onOpenConsentHelpPage}
          style={({ hovered }) => [styles.consentHelpLinkRow, hovered ? styles.consentHelpLinkRowHovered : undefined]}
        >
          <Text isSemibold style={styles.consentHelpLinkText}>
            Hoe vraag ik toestemming?
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}





