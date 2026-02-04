import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function AanpassenIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M10.5 3.75C10.5 2.925 9.825 2.25 9 2.25C8.175 2.25 7.5 2.925 7.5 3.75C7.5 4.575 8.175 5.25 9 5.25C9.825 5.25 10.5 4.575 10.5 3.75Z" fill="white" stroke={color} strokeWidth={1.5} />
      <Path d="M10.5 14.25C10.5 13.425 9.825 12.75 9 12.75C8.175 12.75 7.5 13.425 7.5 14.25C7.5 15.075 8.175 15.75 9 15.75C9.825 15.75 10.5 15.075 10.5 14.25Z" fill="white" stroke={color} strokeWidth={1.5} />
      <Path d="M10.5 9C10.5 8.175 9.825 7.5 9 7.5C8.175 7.5 7.5 8.175 7.5 9C7.5 9.825 8.175 10.5 9 10.5C9.825 10.5 10.5 9.825 10.5 9Z" fill="white" stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

