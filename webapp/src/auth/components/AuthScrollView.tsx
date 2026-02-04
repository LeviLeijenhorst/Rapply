import React from 'react'
import { ScrollView, StyleSheet, ViewStyle } from 'react-native'

type Props = {
  children: React.ReactNode
  contentContainerStyle?: ViewStyle
}

export function AuthScrollView({ children, contentContainerStyle }: Props) {
  return (
    <ScrollView
      style={styles.scrollView as any}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {/* Scrollable content */}
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
    flex: 1,
    ...( { scrollbarWidth: 'none', msOverflowStyle: 'none' } as any ),
  },
  contentContainer: {
    width: '100%',
  },
})

