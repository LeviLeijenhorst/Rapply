import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color?: string
  size?: number
}

export function SubscriptionBadgeIcon({ color = '#BE0165', size = 12 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <Path
        d="M10.0503 2.84469C10.8303 2.28469 11.2053 2.56969 10.8853 3.47469L8.86525 9.12969C8.79525 9.32969 8.56025 9.49469 8.35025 9.49469H3.65025C3.44025 9.49469 3.20525 9.32969 3.13525 9.12969L1.06525 3.33469C0.770252 2.50469 1.11525 2.24969 1.82525 2.75969L3.77525 4.15469C4.10025 4.37969 4.47025 4.26469 4.61025 3.89969L5.49025 1.55469C5.77025 0.804688 6.23525 0.804688 6.51525 1.55469L7.39525 3.89969C7.53525 4.26469 7.90525 4.37969 8.22525 4.15469L8.54025 3.92969"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M3.25 11H8.75" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4.75 7H7.25" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

