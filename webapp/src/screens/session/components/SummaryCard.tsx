import React from 'react'
import { Animated, Easing, LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native'

import { semanticColorTokens } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { InputEditIcon } from '@/icons/InputPageIcons'
import { StarsIcon } from '@/icons/StarsIcon'
import type { SummaryCardProps } from '@/screens/session/sessionScreen.types'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { Text } from '@/ui/Text'

const summaryBodyMinHeight = 192

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
  ;(UIManager as any).setLayoutAnimationEnabledExperimental(true)
}

export function SummaryCard({
  summary,
  title = 'Samenvatting',
  emptyText,
  transcriptionStatus,
  onPressEdit = null,
  onPressRegenerate = null,
  onPressCancelGeneration = null,
}: SummaryCardProps) {
  const summaryText = String(summary || '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  const showLoadingState = transcriptionStatus === 'transcribing' || transcriptionStatus === 'generating'
  const loadingText = transcriptionStatus === 'transcribing' ? 'Transcript wordt gegenereerd...' : 'Samenvatting wordt gegenereerd...'
  const loadingEntranceProgress = React.useRef(new Animated.Value(showLoadingState ? 0 : 1)).current
  const summaryLines = summaryText.split('\n').map((line) => line.trim()).filter(Boolean)

  React.useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
  }, [showLoadingState, summaryText])

  React.useEffect(() => {
    if (!showLoadingState) {
      loadingEntranceProgress.stopAnimation()
      loadingEntranceProgress.setValue(1)
      return undefined
    }
    loadingEntranceProgress.stopAnimation()
    loadingEntranceProgress.setValue(0)
    Animated.timing(loadingEntranceProgress, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
    return () => {
      loadingEntranceProgress.stopAnimation()
    }
  }, [showLoadingState, loadingText, loadingEntranceProgress])

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text isBold style={styles.title}>{title}</Text>
        <View style={styles.headerActionsRow}>
          {onPressRegenerate ? (
            <Pressable onPress={onPressRegenerate} style={({ hovered }) => [styles.editButton, hovered ? styles.editButtonHover : undefined]}>
              <StarsIcon size={18} color="#BE0165" />
            </Pressable>
          ) : null}
          {onPressEdit ? (
            <Pressable onPress={onPressEdit} style={({ hovered }) => [styles.editButton, hovered ? styles.editButtonHover : undefined]}>
              <InputEditIcon size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.bodyContainer}>
        {showLoadingState ? (
          <View style={styles.loadingState}>
            <LoadingSpinner size="small" />
            <Animated.View
              style={{
                opacity: loadingEntranceProgress,
                transform: [
                  {
                    translateY: loadingEntranceProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              }}
            >
              <Text style={styles.cancelGenerationText}>{loadingText}</Text>
            </Animated.View>
            {onPressCancelGeneration ? (
              <Pressable onPress={onPressCancelGeneration} style={({ hovered }) => [styles.cancelGenerationButton, hovered ? styles.cancelGenerationButtonHover : undefined]}>
                <Text isSemibold style={styles.cancelGenerationText}>Annuleren</Text>
              </Pressable>
            ) : null}
          </View>
        ) : summaryText.length === 0 ? (
          <Text style={styles.emptyText}>{emptyText || 'Er is nog geen samenvatting beschikbaar voor deze sessie.'}</Text>
        ) : (
          <View style={styles.summaryRichText}>
            {summaryLines.map((line, index) => {
              const bulletMatch = line.match(/^[-*•]\s+(.+)$/)
              if (bulletMatch?.[1]) {
                return (
                  <View key={`bullet-${index}`} style={styles.bulletRow}>
                    <Text style={styles.summaryText}>•</Text>
                    <Text style={styles.summaryText}>{bulletMatch[1]}</Text>
                  </View>
                )
              }
              return (
                <Text key={`line-${index}`} style={styles.summaryText}>
                  {line}
                </Text>
              )
            })}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.border,
    backgroundColor: semanticColorTokens.light.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...rnShadows.card,
  },
  title: {
    color: semanticColorTokens.light.textStrong,
    fontSize: fontSizes.md,
    lineHeight: 22,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  editButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  bodyContainer: {
    minHeight: summaryBodyMinHeight,
    justifyContent: 'flex-start',
  },
  summaryText: {
    color: semanticColorTokens.light.text,
    fontSize: fontSizes.sm,
    lineHeight: 22,
  },
  summaryRichText: {
    gap: spacing.xs,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  emptyText: {
    color: semanticColorTokens.light.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  loadingState: {
    minHeight: summaryBodyMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  cancelGenerationButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  cancelGenerationButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  cancelGenerationText: {
    color: semanticColorTokens.light.textSecondary,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
})
