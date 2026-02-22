import React from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'

type Props = {
  children: React.ReactNode
}

export function AuthScreenLayout({ children }: Props) {
  const { height } = useWindowDimensions()
  const minHeight = Math.max(760, height)

  return (
    <View style={[styles.page, { minHeight }]}>
      {/* Authentication layout */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 40,
    paddingTop: 40,
    paddingBottom: 64,
    ...( { height: '100vh' } as any ),
  },
  content: {
    flex: 1,
    width: 1240,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
})

