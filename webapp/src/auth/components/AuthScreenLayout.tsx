import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

import { CoachscribeLogo } from '../../components/CoachscribeLogo'

type Props = {
  children: React.ReactNode
}

export function AuthScreenLayout({ children }: Props) {
  const { width, height } = useWindowDimensions()
  const isCompact = width < 1100
  const minHeight = Math.max(760, height)

  return (
    <View style={[styles.page, { minHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo */}
        <CoachscribeLogo />
      </View>

      {/* Main content */}
      <View style={styles.content}>
        <View style={[styles.centered, isCompact ? styles.centeredCompact : undefined]}>{children}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F1F1',
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...( { height: '100vh' } as any ),
  },
  header: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centered: {
    width: 1240,
    maxWidth: '100%',
    flex: 1,
  },
  centeredCompact: {
    width: 900,
  },
})

