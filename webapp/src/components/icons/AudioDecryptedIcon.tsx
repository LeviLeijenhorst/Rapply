import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export function AudioDecryptedIcon({ size = 16, color = '#171717' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9.5 16C9.5 17.38 10.62 18.5 12 18.5C13.38 18.5 14.5 17.38 14.5 16C14.5 14.62 13.38 13.5 12 13.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M22 17V15C22 11 21 10 17 10H7C3 10 2 11 2 15V17C2 21 3 22 7 22H17C18.76 22 19.94 21.81 20.71 21.25" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10V8C6 4.69 7 2 12 2C16.5 2 18 4 18 7" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

