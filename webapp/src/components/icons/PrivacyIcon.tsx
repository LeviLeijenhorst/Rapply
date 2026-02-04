import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function PrivacyIcon({ color = '#656565', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M10.5 3.75H15" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.5 6H12.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M15.75 8.625C15.75 12.5625 12.5625 15.75 8.625 15.75C4.6875 15.75 1.5 12.5625 1.5 8.625C1.5 4.6875 4.6875 1.5 8.625 1.5"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M16.5 16.5L15 15" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

