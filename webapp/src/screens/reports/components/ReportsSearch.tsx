import React from 'react'
import { StyleSheet, View } from 'react-native'

import { SearchBar } from '../../../ui/inputs/SearchBar'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function ReportsSearch({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <SearchBar
        value={value}
        onChangeText={onChange}
        placeholder="Zoek rapportages..."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: 296,
    maxWidth: '100%',
  },
})
