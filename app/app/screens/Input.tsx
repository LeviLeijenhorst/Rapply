import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react"
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputContentSizeChangeEventData, TextInputProps } from "react-native"
import { colors, radius, spacing, typography } from "./constants"

export const Input = forwardRef<TextInput, TextInputProps>((props, ref) => {
  const inputRef = useRef<TextInput>(null)
  useImperativeHandle(ref, () => inputRef.current as TextInput)

  const isMultiline = !!props.multiline
  const multilineLineHeight = 20
  const multilineVerticalPadding = 24
  const multilineDefaultLines = 3

  const multilineMinHeight = useMemo(() => {
    if (!isMultiline) return undefined
    const lines = props.numberOfLines ?? multilineDefaultLines
    return Math.max(64, (lines * multilineLineHeight) + multilineVerticalPadding)
  }, [isMultiline, props.numberOfLines])

  const multilineHeightRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isMultiline) return
    const minHeight = multilineMinHeight ?? 64
    if (multilineHeightRef.current == null || multilineHeightRef.current < minHeight) {
      multilineHeightRef.current = minHeight
      inputRef.current?.setNativeProps({ style: { height: minHeight } })
    }
  }, [isMultiline, multilineMinHeight])

  function handleContentSizeChange(e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) {
    if (!isMultiline) {
      props.onContentSizeChange?.(e)
      return
    }

    const contentHeight = Math.ceil(e.nativeEvent.contentSize.height)
    const nextHeight = Math.max(multilineMinHeight ?? 64, contentHeight)
    const currentHeight = multilineHeightRef.current ?? (multilineMinHeight ?? 64)

    if (nextHeight > currentHeight) {
      multilineHeightRef.current = nextHeight
      inputRef.current?.setNativeProps({ style: { height: nextHeight } })
    }

    props.onContentSizeChange?.(e)
  }

  return (
    <TextInput
      ref={inputRef}
      {...props}
      placeholderTextColor={props.placeholderTextColor ?? colors.textOrange + "33"}
      onContentSizeChange={handleContentSizeChange}
      onKeyPress={isMultiline ? (e) => {
        if (e.nativeEvent.key === "Enter") {
          const minHeight = multilineMinHeight ?? 64
          const currentHeight = multilineHeightRef.current ?? minHeight
          const nextHeight = Math.max(minHeight, currentHeight + multilineLineHeight)
          multilineHeightRef.current = nextHeight
          inputRef.current?.setNativeProps({ style: { height: nextHeight } })
        }
        props.onKeyPress?.(e)
      } : props.onKeyPress}
      style={[
        styles.input,
        isMultiline ? styles.multiline : null,
        isMultiline ? { height: multilineHeightRef.current ?? multilineMinHeight, minHeight: multilineMinHeight } : null,
        props.style,
      ]}
      textAlignVertical={isMultiline ? "top" : undefined}
      scrollEnabled={isMultiline ? false : props.scrollEnabled}
    />
  )
})

const styles = StyleSheet.create({
  input: {
    height: 64,
    borderRadius: radius,
    backgroundColor: colors.orange + "0D",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: spacing.big,
    fontFamily: typography.fontFamily,
    fontSize: typography.textSize,
    color: colors.textSecondary,
  },
  multiline: {
    minHeight: 64,
    height: undefined as unknown as number,
    paddingTop: 12,
    paddingBottom: 12,
    lineHeight: 20,
    includeFontPadding: false,
  },
})
