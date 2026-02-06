import React from 'react'
import { StyleSheet, View } from 'react-native'

import { colors } from '../../theme/colors'

type Props = {
  children: React.ReactNode
}

export function AuthCard({ children }: Props) {
  return (
    <View style={styles.card}>
      {/* Card */}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...( { boxShadow: '0 20px 60px rgba(0,0,0,0.16)' } as any ),
  },
})

