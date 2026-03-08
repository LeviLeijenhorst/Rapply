import React from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'

type Props = {
  children: React.ReactNode
}

export function AuthScreenLayout({ children }: Props) {
  const { width } = useWindowDimensions()
  const isCompact = width < 900

  return (
    <View style={[styles.page, isCompact ? styles.pageCompact : undefined]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, isCompact ? styles.contentCompact : undefined]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    ...( { backgroundImage: 'linear-gradient(to top right, rgba(184, 212, 255, 0.25), rgba(198, 175, 255, 0.25))' } as any ),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
    ...( { height: '100vh' } as any ),
  },
  pageCompact: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  scroll: {
    width: '100%',
    flex: 1,
  },
  content: {
    width: '100%',
    minHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCompact: {
    justifyContent: 'flex-start',
    paddingTop: 8,
    paddingBottom: 8,
  },
})

