import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
}

export function ModalCloseIcon({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 55 55" fill="none">
      <Path d="M20.5859 34.3099L34.3099 20.586" stroke="#BE0165" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M34.3099 34.3097L20.5859 20.5858" stroke="#BE0165" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

