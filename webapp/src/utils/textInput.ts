import React from 'react'
import { TextInput } from 'react-native'

export function focusAndSelectAll(inputRef: React.MutableRefObject<TextInput | null>, value: string) {
  const input = inputRef.current
  if (!input) return
  input.focus()
  const length = value.length
  setTimeout(() => {
    if (typeof (input as any).setSelection === 'function') {
      ;(input as any).setSelection(0, length)
      return
    }
    if (typeof (input as any).setNativeProps === 'function') {
      ;(input as any).setNativeProps({ selection: { start: 0, end: length } })
    }
  }, 0)
}
