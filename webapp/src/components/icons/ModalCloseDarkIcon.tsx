import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
}

export function ModalCloseDarkIcon({ size = 34 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <Path d="M12.728 21.2132L21.2133 12.728" stroke="#1D0A00" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21.2133 21.2132L12.728 12.7279" stroke="#1D0A00" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

