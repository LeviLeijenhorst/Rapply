import React from 'react'
import { StyleSheet, View } from 'react-native'
import { LoadingSpinner } from '../../../../ui/LoadingSpinner'

import { Text } from '../../../../ui/Text'

type Props = {
  message: string
}

export function AuthLoadingScreen({ message }: Props) {
  return (
    <View style={styles.loadingContainer}>
      <LoadingSpinner size="large" />
      <Text style={styles.loadingText}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6B6B',
  },
})


