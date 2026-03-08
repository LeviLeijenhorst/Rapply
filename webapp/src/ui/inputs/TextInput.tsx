import React from 'react'
import { TextInput as NativeTextInput, TextInputProps } from 'react-native'

export type AppTextInputProps = TextInputProps

export const TextInput = React.forwardRef<NativeTextInput, AppTextInputProps>(function TextInput(props, ref) {
  return <NativeTextInput ref={ref} {...props} />
})

export function focusAndSelectAll(ref: React.RefObject<NativeTextInput | null>, value: string): void {
  const input = ref.current
  if (!input) return
  input.focus()
  const nextValue = String(value || '')
  input.setNativeProps?.({
    selection: { start: 0, end: nextValue.length },
  } as never)
}
