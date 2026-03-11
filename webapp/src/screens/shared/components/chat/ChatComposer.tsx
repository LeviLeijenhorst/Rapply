import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

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
  preferCenteredSingleLine?: boolean
  forceSingleLine?: boolean
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
  preferCenteredSingleLine = false,
  forceSingleLine = false,
}: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const composerMinHeight = compact ? 40 : 44
  const [inputHeight, setInputHeight] = useState(composerMinHeight)
  const [isScrollable, setIsScrollable] = useState(false)
  const inputHeightRef = useRef(inputHeight)
  const isScrollableRef = useRef(isScrollable)
  const inputRef = useRef<TextInput | null>(null)

  const { minHeight, maxHeight } = useMemo(() => {
    const baseHeight = composerMinHeight
    const maxLines = 7
    const lineHeight = compact ? 18 : 20
    const maxExtra = (maxLines - 1) * lineHeight
    return { minHeight: baseHeight, maxHeight: baseHeight + maxExtra }
  }, [compact, composerMinHeight])

  const inputScrollStyle = { overflowY: isScrollable ? 'auto' : 'hidden' } as any
  const isSingleLine = forceSingleLine
  const inputTextAlignVertical =
    isSingleLine
      ? 'center'
      : preferCenteredSingleLine && inputHeight <= minHeight + 4
      ? 'center'
      : inputHeight > minHeight
        ? 'top'
        : 'center'

  useEffect(() => {
    if (value.trim().length > 0) return
    if (inputHeightRef.current !== minHeight) {
      inputHeightRef.current = minHeight
      setInputHeight(minHeight)
    }
    if (isScrollableRef.current !== false) {
      isScrollableRef.current = false
      setIsScrollable(false)
    }
  }, [minHeight, value])

  useEffect(() => {
    if (!shouldAutoFocus) return
    const id = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(id)
  }, [autoFocusKey, shouldAutoFocus])

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View
          style={[
            styles.inputContainer,
            compact ? styles.inputContainerCompact : undefined,
            isSingleLine ? styles.inputContainerSingleLine : undefined,
            { height: inputHeight },
          ]}
        >
          <TextInput
            ref={(nextValue) => {
              inputRef.current = nextValue
            }}
            value={value}
            onChangeText={onChangeValue}
            placeholder=""
            placeholderTextColor="#8E8480"
            multiline={!isSingleLine}
            scrollEnabled={!isSingleLine && isScrollable}
            textAlignVertical={inputTextAlignVertical}
            onKeyPress={(event: any) => {
              const key = event?.nativeEvent?.key
              const isShift = Boolean(event?.nativeEvent?.shiftKey)
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
            onContentSizeChange={(event) => {
              if (isSingleLine) return
              const contentHeight = Math.ceil((event.nativeEvent.contentSize?.height ?? 0) + 24)
              const nextHeight = Math.max(minHeight, Math.min(maxHeight, contentHeight))

              const heightDelta = Math.abs(nextHeight - inputHeightRef.current)
              if (heightDelta >= 1) {
                inputHeightRef.current = nextHeight
                setInputHeight(nextHeight)
              }

              const scrollThreshold = 2
              const shouldEnableScroll = contentHeight > maxHeight + scrollThreshold
              const shouldDisableScroll = contentHeight < maxHeight - scrollThreshold
              const nextIsScrollable = shouldEnableScroll ? true : shouldDisableScroll ? false : isScrollableRef.current

              if (nextIsScrollable !== isScrollableRef.current) {
                isScrollableRef.current = nextIsScrollable
                setIsScrollable(nextIsScrollable)
              }
            }}
            style={[
              styles.input,
              compact ? styles.inputCompact : undefined,
              isSingleLine ? styles.inputSingleLine : undefined,
              inputWebStyle,
              inputScrollStyle,
            ]}
          />
        </View>

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
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#F3F4F6',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    minHeight: 44,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    justifyContent: 'flex-start',
  },
  inputContainerCompact: {
    minHeight: 36,
  },
  inputContainerSingleLine: {
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    fontSize: 16,
    lineHeight: 22,
    paddingBottom: 0,
    color: colors.text,
    flex: 1,
  },
  inputCompact: {
    lineHeight: 22,
  },
  inputSingleLine: {
    height: 22,
    lineHeight: 22,
    paddingTop: 0,
    paddingBottom: 0,
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
