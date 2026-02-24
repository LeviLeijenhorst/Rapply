import React from 'react'
import { StyleSheet, View } from 'react-native'

type Props = {
  contentKey: string
  render: (contentKey: string) => React.ReactNode
}

export function AuthCardVerticalSwapTransition({ contentKey, render }: Props) {
  return (
    <View style={styles.container}>
      {/* Authentication card */}
      <View style={styles.layer}>{render(contentKey)}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

