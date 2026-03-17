import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../../../design/theme/colors'
import { ArrowUpIcon } from '../../../../icons/ArrowUpIcon'
import { SendIcon } from '../../../../icons/SendIcon'
import { Text } from '../../../../ui/Text'

type Props = {
  value: string
  onChangeValue: (value: string) => void
  onSend: () => void
  compact?: boolean
  shouldAutoFocus?: boolean
  autoFocusKey?: string | number
  isSendDisabled?: boolean
  onPressEscape?: () => void
  showDisclaimer?: boolean
  sendIconVariant?: 'send' | 'arrow'
  focusTrigger?: number
}

const tabAutocompleteSuggestions = [
  'Maak een korte samenvatting van dit verslag.',
  'Welke actiepunten volgen uit dit verslag?',
  'Welke doelen zijn besproken in dit verslag?',
  'Vat dit samen in bullet points.',
  'Geef mij 3 verdiepende vragen voor het volgende verslag.',
]

function applyTabAutocomplete(value: string): string | null {
  const trimmed = String(value || '').trim()
  if (!trimmed) return tabAutocompleteSuggestions[0]
  const lower = trimmed.toLowerCase()
  const suggestion = tabAutocompleteSuggestions.find((item) => item.toLowerCase().startsWith(lower))
  return suggestion && suggestion.length > trimmed.length ? suggestion : null
}

export function ChatComposer({
  value,
  onChangeValue,
  onSend,
  compact = false,
  shouldAutoFocus = false,
  autoFocusKey,
  isSendDisabled = false,
  onPressEscape,
  showDisclaimer = true,
  sendIconVariant = 'send',
  focusTrigger,
}: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const [isScrollable, setIsScrollable] = useState(false)
  const inputHeightRef = useRef(0)
  const isScrollableRef = useRef(isScrollable)
  const visibleLineCountRef = useRef(1)
  const inputWidthRef = useRef(0)
  const canvasContextRef = useRef<CanvasRenderingContext2D | null>(null)
  const inputRef = useRef<TextInput | null>(null)
  const animatedHeight = useRef(new Animated.Value(0)).current

  const { minHeight, lineHeight, maxLines, verticalPadding, inputPaddingTop, inputPaddingBottom } = useMemo(() => {
    const maxLines = 7
    const nextLineHeight = compact ? 18 : 20
    const verticalPadding = compact ? 12 : 12
    const minHeight = verticalPadding + nextLineHeight
    const inputPaddingTop = 6
    const inputPaddingBottom = 6
    return { minHeight, lineHeight: nextLineHeight, maxLines, verticalPadding, inputPaddingTop, inputPaddingBottom }
  }, [compact])

  useEffect(() => {
    inputHeightRef.current = minHeight
    animatedHeight.setValue(minHeight)
    visibleLineCountRef.current = 1
  }, [animatedHeight, minHeight])

  const inputScrollStyle = {
    overflowY: isScrollable ? 'auto' : 'hidden',
    backgroundColor: 'transparent',
    scrollbarColor: isScrollable ? '#C7C9CE transparent' : undefined,
  } as any

  function animateToHeight(nextHeight: number) {
    if (Math.abs(nextHeight - inputHeightRef.current) < 1) return
    inputHeightRef.current = nextHeight
    animatedHeight.stopAnimation()
    Animated.timing(animatedHeight, {
      toValue: nextHeight,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start()
  }

  useEffect(() => {
    if (value.trim().length > 0) return
    visibleLineCountRef.current = 1
    animateToHeight(minHeight)
    if (isScrollableRef.current !== false) {
      isScrollableRef.current = false
      setIsScrollable(false)
    }
  }, [minHeight, value, animatedHeight])

  useEffect(() => {
    if (!shouldAutoFocus) return
    const timeouts = [0, 120, 260].map((delay) => setTimeout(() => inputRef.current?.focus(), delay))
    return () => timeouts.forEach((id) => clearTimeout(id))
  }, [autoFocusKey, shouldAutoFocus])

  useEffect(() => {
    if (typeof focusTrigger !== 'number') return
    const id = setTimeout(() => inputRef.current?.focus(), 0)
    return () => clearTimeout(id)
  }, [focusTrigger])

  function getExplicitLineCount(rawValue: string): number {
    return Math.max(1, String(rawValue || '').split('\n').length)
  }

  function updateLineState(lineCount: number) {
    const normalizedLineCount = Math.max(1, lineCount)
    const visibleLineCount = Math.min(maxLines, normalizedLineCount)
    if (visibleLineCount !== visibleLineCountRef.current) {
      visibleLineCountRef.current = visibleLineCount
      animateToHeight(verticalPadding + visibleLineCount * lineHeight)
    }
    const nextIsScrollable = normalizedLineCount > maxLines
    if (nextIsScrollable !== isScrollableRef.current) {
      isScrollableRef.current = nextIsScrollable
      setIsScrollable(nextIsScrollable)
    }
  }

  function getCanvasContext(): CanvasRenderingContext2D | null {
    if (typeof document === 'undefined') return null
    if (canvasContextRef.current) return canvasContextRef.current
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return null
    canvasContextRef.current = context
    return context
  }

  function estimateWrappedLineCount(nextValue: string): number {
    const explicitLines = getExplicitLineCount(nextValue)
    const availableWidth = Math.floor(inputWidthRef.current)
    if (!availableWidth || availableWidth <= 0) return explicitLines
    const context = getCanvasContext()
    if (!context) return explicitLines

    const fontSize = compact ? 15 : 16
    context.font = `${fontSize}px sans-serif`
    const paragraphs = String(nextValue || '').split('\n')
    let totalLines = 0

    for (const paragraph of paragraphs) {
      if (!paragraph) {
        totalLines += 1
        continue
      }

      let currentLineWidth = 0
      let paragraphLines = 1
      const tokens = paragraph.split(/(\s+)/).filter((token) => token.length > 0)

      for (const token of tokens) {
        const tokenWidth = context.measureText(token).width
        if (currentLineWidth + tokenWidth <= availableWidth) {
          currentLineWidth += tokenWidth
          continue
        }

        if (currentLineWidth > 0) {
          paragraphLines += 1
          currentLineWidth = tokenWidth
          continue
        }

        const estimatedTokenLines = Math.max(1, Math.ceil(tokenWidth / availableWidth))
        paragraphLines += estimatedTokenLines - 1
        const remainderWidth = tokenWidth % availableWidth
        currentLineWidth = remainderWidth === 0 ? availableWidth : remainderWidth
      }

      totalLines += paragraphLines
    }

    return Math.max(explicitLines, totalLines)
  }

  function handleChangeText(nextValue: string) {
    updateLineState(estimateWrappedLineCount(nextValue))
    onChangeValue(nextValue)
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.inputContainer,
            compact ? styles.inputContainerCompact : undefined,
            { height: animatedHeight },
          ]}
          onLayout={(event) => {
            const measuredWidth = Math.floor(event.nativeEvent.layout.width ?? 0)
            if (!measuredWidth) return
            inputWidthRef.current = measuredWidth
          }}
        >
          <TextInput
            ref={(nextValue) => {
              inputRef.current = nextValue
            }}
            value={value}
            onChangeText={handleChangeText}
            placeholder=""
            placeholderTextColor="#8E8480"
            multiline
            scrollEnabled={isScrollable}
            textAlignVertical="top"
            onKeyPress={(event: any) => {
              const key = event?.nativeEvent?.key
              const isShift = Boolean(event?.nativeEvent?.shiftKey ?? event?.shiftKey)
              if (key === 'Tab') {
                if (typeof event?.preventDefault === 'function') event.preventDefault()
                const suggestion = applyTabAutocomplete(value)
                if (suggestion) onChangeValue(suggestion)
                return
              }
              if (key === 'Escape') {
                if (typeof event?.preventDefault === 'function') event.preventDefault()
                onPressEscape?.()
                return
              }
              if (key === 'Enter' && !isShift) {
                if (typeof event?.preventDefault === 'function') event.preventDefault()
                if (value.trim().length === 0 || isSendDisabled) return
                onSend()
              }
            }}
            style={[
              styles.input,
              compact ? styles.inputCompact : undefined,
              { lineHeight, paddingTop: inputPaddingTop, paddingBottom: inputPaddingBottom },
              inputWebStyle,
              inputScrollStyle,
            ]}
          />
        </Animated.View>

        <Pressable
          onPress={() => {
            if (isSendDisabled) return
            onSend()
          }}
          style={({ hovered }) => [
            styles.sendButton,
            compact ? styles.sendButtonCompact : styles.sendButtonDefault,
            isSendDisabled ? styles.sendButtonDisabled : undefined,
            hovered ? styles.sendButtonHovered : undefined,
          ]}
        >
          {sendIconVariant === 'arrow' ? <ArrowUpIcon color="#FFFFFF" size={16} /> : <SendIcon size={16} />}
        </Pressable>
      </View>
      {showDisclaimer ? (
        <View style={[styles.disclaimerRow, compact ? styles.disclaimerRowCompact : undefined]}>
          <Text style={styles.disclaimerText}>Antwoorden in deze chat worden gegenereerd door AI</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 8,
  },
  row: {
    width: '100%',
    minHeight: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F3F4F6',
    paddingLeft: 12,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: 'hidden',
  },
  inputContainerCompact: {
    minHeight: 0,
  },
  input: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    backgroundColor: 'transparent',
  },
  inputCompact: {
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: colors.selected,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDefault: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sendButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  sendButtonHovered: {
    backgroundColor: '#A50058',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  disclaimerText: {
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSecondary,
    opacity: 0.7,
    textAlign: 'center',
  },
  disclaimerRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  disclaimerRowCompact: {
    paddingTop: 4,
  },
})
