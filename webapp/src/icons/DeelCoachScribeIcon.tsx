import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function DeelCoachScribeIcon({ color = '#656565', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M9 11.2498V2.71484" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11.5125 4.3875L9 1.875L6.4875 4.3875" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M6.555 16.1251C3.2025 16.1251 1.86 14.7826 1.86 11.4301V11.3326C1.86 8.31762 2.9475 6.93012 5.6025 6.68262"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.33 6.6748C15.03 6.9073 16.1325 8.2948 16.1325 11.3323V11.4298C16.1325 14.7823 14.79 16.1248 11.4375 16.1248H9.75751"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

