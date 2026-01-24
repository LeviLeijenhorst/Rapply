import React from 'react'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

type Props = {
  color: string
}

export function CoachscribeMarkIcon({ color }: Props) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Defs>
        <LinearGradient id="paint0_linear_40_4061" x1={1.49953} y1={22.8828} x2={22.7342} y2={0.260399} gradientUnits="userSpaceOnUse">
          <Stop stopColor="#FF5B03" />
          <Stop offset={1} stopColor="#FF8F52" />
        </LinearGradient>
      </Defs>
      <Path
        d="M2.67547 19.4592L0.000227125 23.8646L2.83616 22.7766L5.27208 19.7079L9.04198 19.4619L10.9367 16.3451L10.5904 13.4942L13.6192 13.1263L16.4944 9.71114L15.8944 6.74018L19.3197 6.04845L23.7022 0.0097814C15.9051 -0.182568 11.2231 2.39305 2.0648 13.9136L2.67547 19.4592Z"
        fill="url(#paint0_linear_40_4061)"
      />
    </Svg>
  )
}

