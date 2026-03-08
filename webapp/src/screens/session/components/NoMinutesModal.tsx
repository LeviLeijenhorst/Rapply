import React from 'react'

type Props = {
  visible: boolean
  [key: string]: unknown
}

export function NoMinutesModal(props: Props) {
  if (!props.visible) return null
  return null
}
