import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
}

export function AudioPlayButtonIcon({ size = 48 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM29.32 27.46L26.76 28.94L24.2 30.42C20.9 32.32 18.2 30.76 18.2 26.96V24V21.04C18.2 17.22 20.9 15.68 24.2 17.58L26.76 19.06L29.32 20.54C32.62 22.44 32.62 25.56 29.32 27.46Z"
        fill="#BF0265"
      />
    </Svg>
  )
}

