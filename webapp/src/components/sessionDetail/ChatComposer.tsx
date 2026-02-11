import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'

import { colors } from '../../theme/colors'
import { SendIcon } from '../icons/SendIcon'
import { Text } from '../Text'

type Props = {
  value: string
  onChangeValue: (value: string) => void
  onSend: () => void
  shouldAutoFocus?: boolean
  autoFocusKey?: string | number
  isSendDisabled?: boolean
  onPressEscape?: () => void
}

export function ChatComposer({
  value,
  onChangeValue,
  onSend,
  shouldAutoFocus = false,
  autoFocusKey,
  isSendDisabled = false,
  onPressEscape,
}: Props) {
  const inputWebStyle = { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any
  const [inputHeight, setInputHeight] = useState(44)
  const [isScrollable, setIsScrollable] = useState(false)
  const inputHeightRef = useRef(inputHeight)
  const isScrollableRef = useRef(isScrollable)
  const inputRef = useRef<TextInput | null>(null)

  const { minHeight, maxHeight } = useMemo(() => {
    const baseHeight = 44
    const maxLines = 7
    const lineHeight = 20
    const maxExtra = (maxLines - 1) * lineHeight
    return { minHeight: baseHeight, maxHeight: baseHeight + maxExtra }
  }, [])

  const inputScrollStyle = { overflowY: isScrollable ? 'auto' : 'hidden' } as any

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
        {/* Chat composer */}
        <View style={[styles.inputContainer, { height: inputHeight }]}>
          <TextInput
            ref={(value) => {
              inputRef.current = value
            }}
            value={value}
            onChangeText={onChangeValue}
            placeholder=""
            placeholderTextColor="#8E8480"
            multiline
            scrollEnabled={isScrollable}
            textAlignVertical="top"
            onKeyPress={(event: any) => {
              const key = event?.nativeEvent?.key
              const isShift = Boolean(event?.nativeEvent?.shiftKey)
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
            style={[styles.input, inputWebStyle, inputScrollStyle]}
          />
        </View>

        <Pressable
          onPress={() => {
            if (isSendDisabled) return
            onSend()
          }}
          style={({ hovered }) => [styles.sendButton, isSendDisabled ? styles.sendButtonDisabled : undefined, hovered ? styles.sendButtonHovered : undefined]}
        >
          {/* Send button */}
          <SendIcon size={24} />
        </Pressable>
      </View>
      <View style={styles.disclaimerRow}>
        <Text style={styles.disclaimerText}>Antwoorden in deze chat worden gegenereerd door AI</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    justifyContent: 'flex-start',
  },
  input: {
    padding: 0,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.selected,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingRight: 52,
  },
})

