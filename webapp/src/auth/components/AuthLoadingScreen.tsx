import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { Text } from '../../components/Text'

type Props = {
  message: string
}

export function AuthLoadingScreen({ message }: Props) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#E07A7A" />
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
