import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export function PracticeEditFieldIcon({ size = 22, color = '#1D0A00' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.26 3.60022L5.04997 12.2902C4.73997 12.6202 4.43997 13.2702 4.37997 13.7202L4.00997 16.9602C3.87997 18.1302 4.71997 18.9302 5.87997 18.7302L9.09997 18.1802C9.54997 18.1002 10.18 17.7702 10.49 17.4302L18.7 8.74022C20.12 7.24022 20.76 5.53022 18.55 3.44022C16.35 1.37022 14.68 2.10022 13.26 3.60022Z"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M11.89 5.0498C12.32 7.8098 14.56 9.9198 17.34 10.1998" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 22H21" stroke={color} strokeWidth={1.5} strokeMiterlimit={10} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
