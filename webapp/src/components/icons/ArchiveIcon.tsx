import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function ArchiveIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M14.625 7.66504V14.25C14.625 15.75 14.25 16.5 12.375 16.5H5.625C3.75 16.5 3.375 15.75 3.375 14.25V7.66504" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.75 1.5H14.25C15.75 1.5 16.5 2.25 16.5 3.75V5.25C16.5 6.75 15.75 7.5 14.25 7.5H3.75C2.25 7.5 1.5 6.75 1.5 5.25V3.75C1.5 2.25 2.25 1.5 3.75 1.5Z" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.63501 10.5H10.365" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

