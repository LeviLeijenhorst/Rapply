import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
}

export function AudioBackwardIcon({ size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9.54004 15.92V10.5801L8.04004 12.2501" stroke="#1D0A00" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10.02 4.46997L12 2" stroke="#1D0A00" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M4.90988 7.79999C3.79988 9.27999 3.10986 11.11 3.10986 13.11C3.10986 18.02 7.08988 22 11.9999 22C16.9099 22 20.8899 18.02 20.8899 13.11C20.8899 8.19999 16.9099 4.21997 11.9999 4.21997C11.3199 4.21997 10.6599 4.31002 10.0199 4.46002"
        stroke="#1D0A00"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 10.5801C15.1 10.5801 16 11.4801 16 12.5801V13.9301C16 15.0301 15.1 15.9301 14 15.9301C12.9 15.9301 12 15.0301 12 13.9301V12.5801C12 11.4701 12.9 10.5801 14 10.5801Z"
        stroke="#1D0A00"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

