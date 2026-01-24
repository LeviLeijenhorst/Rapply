import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../theme/colors'
import { CoacheeDropdown } from './CoacheeDropdown'
import { CoachscribeLogo } from './CoachscribeLogo'
import { SettingsIcon } from './icons/SettingsIcon'
import { UsageIndicator } from './UsageIndicator'

export function Navbar() {
  return (
    <View style={styles.container}>
      {/* Navbar area above sidebar */}
      <View style={styles.leftArea}>
        {/* Coachscribe logo */}
        <CoachscribeLogo />
      </View>

      {/* Navbar area to the right of the sidebar */}
      <View style={styles.rightArea}>
        {/* Coachee dropdown */}
        <CoacheeDropdown coacheeName="Coachee naam" onPress={() => undefined} />

        {/* Right actions */}
        <View style={styles.rightActions}>
          {/* Usage indicator */}
          <UsageIndicator usedMinutes={24} availableMinutes={60} planLabel="Basis" />
          {/* Settings icon */}
          <SettingsIcon color={colors.text} size={24} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 89,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftArea: {
    width: 220,
    height: '100%',
    padding: 24,
    justifyContent: 'center',
  },
  rightArea: {
    flex: 1,
    height: '100%',
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
})

