import React from 'react'
import { StyleSheet, View } from 'react-native'

type Props = {
  children: React.ReactNode
}

export function AuthScreenLayout({ children }: Props) {
  return (
    <View style={styles.page}>
      {/* Authentication layout */}
      <View style={styles.content}>{children}</View>
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
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

