import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export function StarsIcon({ size = 14, color = '#667085' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.4 3.2L13.75 7.2L17.75 8.55L13.75 9.9L12.4 13.9L11.05 9.9L7.05 8.55L11.05 7.2L12.4 3.2Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.25 13.25L19 15.5L21.25 16.25L19 17L18.25 19.25L17.5 17L15.25 16.25L17.5 15.5L18.25 13.25Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.75 13L6.3 14.65L7.95 15.2L6.3 15.75L5.75 17.4L5.2 15.75L3.55 15.2L5.2 14.65L5.75 13Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
