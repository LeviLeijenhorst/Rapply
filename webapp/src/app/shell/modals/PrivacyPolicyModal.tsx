import React, { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'

import { Modal } from '../../../ui/animated/Modal'
import { FormattedText } from '../../../ui/FormattedText'
import { Text } from '../../../ui/Text'
import { colors } from '../../../design/theme/colors'
import { ModalCloseDarkIcon } from '../../../icons/ModalCloseDarkIcon'

type Props = {
  visible: boolean
  text: string
  onClose: () => void
}

type PrivacyLine = {
  kind: 'title' | 'sectionHeader' | 'keyValue' | 'paragraph' | 'empty'
  text: string
}

function parsePrivacyLines(text: string): PrivacyLine[] {
  const rawLines = String(text || '').replace(/\r/g, '').split('\n')
  const lines = rawLines.map((line) => line.trimEnd())
  const result: PrivacyLine[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const trimmedLine = rawLine.trim()

    if (!trimmedLine) {
      result.push({ kind: 'empty', text: '' })
      continue
    }

    if (index === 0) {
      result.push({ kind: 'title', text: trimmedLine })
      continue
    }

    const colonIndex = trimmedLine.indexOf(':')
    if (colonIndex > 0) {
      const key = trimmedLine.slice(0, colonIndex).trim()
      const value = trimmedLine.slice(colonIndex + 1).trim()
      if (key.length > 0 && key.length <= 26 && value.length > 0) {
        result.push({ kind: 'keyValue', text: `**${key}:** ${value}` })
        continue
      }
    }

    const isLikelyHeader =
      trimmedLine.length <= 48 &&
      !trimmedLine.includes('.') &&
      !trimmedLine.includes(':') &&
      !trimmedLine.startsWith('http') &&
      !trimmedLine.startsWith('www.')

    if (isLikelyHeader) {
      result.push({ kind: 'sectionHeader', text: trimmedLine })
      continue
    }

    result.push({ kind: 'paragraph', text: trimmedLine })
  }

  return result
}

export function PrivacyPolicyModal({ visible, text, onClose }: Props) {
  const parsedLines = useMemo(() => parsePrivacyLines(text), [text])

  if (!visible) return null

  return (
    <Modal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      {/* Modal header */}
      <View style={styles.header}>
        {/* Header title */}
        <Text isBold style={styles.headerTitle}>
          Privacy beleid
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          {/* Close */}
          <ModalCloseDarkIcon />
        </Pressable>
      </View>

      {/* Modal body */}
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        {/* Privacy policy content */}
        <View style={styles.content}>
          {parsedLines.map((line, index) => {
            if (line.kind === 'empty') return <View key={`empty-${index}`} style={styles.spacer} />
            if (line.kind === 'title') {
              return (
                <Text key={`title-${index}`} isBold style={styles.title}>
                  {line.text}
                </Text>
              )
            }
            if (line.kind === 'sectionHeader') {
              return (
                <Text key={`h-${index}`} isBold style={styles.sectionHeader}>
                  {line.text}
                </Text>
              )
            }
            if (line.kind === 'keyValue') {
              return <FormattedText key={`kv-${index}`} text={line.text} textStyle={styles.paragraph} boldStyle={styles.paragraphBold} />
            }
            return <FormattedText key={`p-${index}`} text={line.text} textStyle={styles.paragraph} boldStyle={styles.paragraphBold} />
          })}
        </View>
      </ScrollView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 860,
    maxWidth: '90vw',
    maxHeight: '85vh',
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' } as any ),
  },
  header: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: '100%',
  },
  bodyContent: {
    padding: 24,
  },
  content: {
    width: '100%',
    gap: 10,
  },
  spacer: {
    height: 10,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    color: colors.textStrong,
  },
  sectionHeader: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textStrong,
    marginTop: 4,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
  paragraphBold: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
})


