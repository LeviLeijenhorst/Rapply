import React from 'react'
import { Pressable, ScrollView, StyleSheet } from 'react-native'

import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'

type Props = {
  onSelectSuggestion: (text: string) => void
}

const suggestions = ['Algemene samenvatting', 'Voorbereiden', "Thema's", 'Gespreksplan']

export function ChatSuggestionsRow({ onSelectSuggestion }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Suggestions */}
      {suggestions.map((suggestion) => (
        <Pressable
          key={suggestion}
          onPress={() => onSelectSuggestion(suggestion)}
          style={({ hovered }) => [styles.chip, hovered ? styles.chipHovered : undefined]}
        >
          {/* Suggestion */}
          <Text style={styles.chipText}>{suggestion}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  chip: {
    height: 32,
    borderRadius: 16,
    padding: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipHovered: {
    backgroundColor: colors.hoverBackground,
  },
  chipText: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.textSecondary,
  },
})


