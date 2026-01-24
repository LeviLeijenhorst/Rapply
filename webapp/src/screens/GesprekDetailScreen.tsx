import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from '../components/Text'
import { colors } from '../theme/colors'
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon'
import { EditSmallIcon } from '../components/icons/EditSmallIcon'
import { ShareTranscriptIcon } from '../components/icons/ShareTranscriptIcon'
import { TrashIcon } from '../components/icons/TrashIcon'

type Props = {
  title: string
  onBack: () => void
}

export function GesprekDetailScreen({ title, onBack }: Props) {
  return (
    <View style={styles.container}>
      {/* Detail header */}
      <View style={styles.headerRow}>
        <View style={styles.leftHeader}>
          <Pressable onPress={onBack} style={styles.backButton}>
            {/* Back button */}
            <ChevronLeftIcon color="#656565" size={24} />
            <Text isBold style={styles.backText}>
              Terug
            </Text>
          </Pressable>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>

        <View style={styles.rightHeader}>
          <Pressable onPress={() => undefined} style={styles.secondaryActionButton}>
            {/* Share button */}
            <ShareTranscriptIcon color="#656565" size={18} />
            <Text isBold style={styles.secondaryActionText}>
              Delen
            </Text>
          </Pressable>
          <Pressable onPress={() => undefined} style={styles.secondaryActionButton}>
            {/* Edit button */}
            <EditSmallIcon color="#656565" size={18} />
            <Text isBold style={styles.secondaryActionText}>
              Bewerken
            </Text>
          </Pressable>
          <Pressable onPress={() => undefined} style={styles.deleteActionButton}>
            {/* Delete button */}
            <TrashIcon color="#FF0001" size={18} />
            <Text isBold style={styles.deleteActionText}>
              Verwijderen
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Detail content */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>Gesprek detail pagina</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    height: 40,
    width: 102,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    color: colors.text,
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  secondaryActionButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#656565',
  },
  deleteActionButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F7DDDD',
    borderWidth: 1,
    borderColor: '#FF0001',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteActionText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FF0001',
  },
  content: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 16,
    lineHeight: 20,
    color: colors.textSecondary,
  },
})

