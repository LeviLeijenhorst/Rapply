import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

type Props = {
  children: React.ReactNode
}

export function AuthScreenLayout({ children }: Props) {
  const { width, height } = useWindowDimensions()
  const minHeight = Math.max(760, height)

  return (
    <View style={[styles.page, { minHeight }]}>
      {/* Top spacer */}
      <View style={styles.topSpacer} />
      {/* Authentication layout */}
      <View style={styles.content}>{children}</View>
      {/* Bottom spacer */}
      <View style={styles.bottomSpacer} />
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 0,
    ...( { height: '100vh' } as any ),
  },
  content: {
    width: 1240,
    maxWidth: '100%',
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1,
  },
  bottomSpacer: {
    flex: 1.2,
  },
})

