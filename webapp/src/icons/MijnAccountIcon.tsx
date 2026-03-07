import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function MijnAccountIcon({ color = '#656565', size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M11.265 2.25751C10.635 1.77751 9.855 1.5 9 1.5C6.93 1.5 5.25 3.18 5.25 5.25C5.25 7.32 6.93 9 9 9C11.07 9 12.75 7.32 12.75 5.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M15.4425 16.5C15.4425 13.5975 12.555 11.25 8.99999 11.25C5.44499 11.25 2.5575 13.5975 2.5575 16.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

