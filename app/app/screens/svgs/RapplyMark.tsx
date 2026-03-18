import React from "react"
import Svg, { Path } from "react-native-svg"

export default function RapplyMark({
  size = 16,
  color = "#1D0A00",
  strokeWidth = 1,
}: {
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return (
    <Svg width={size} height={size} viewBox="54 24 24 24" fill="none">
      <Path
        d="M56.6752 43.4592L54 47.8646L56.8359 46.7766L59.2718 43.7079L63.0417 43.4619L64.9365 40.3451L64.5901 37.4942L67.6189 37.1263L70.4942 33.7111L69.8942 30.7402L73.3194 30.0484L77.7019 24.0098C69.9048 23.8174 65.2229 26.393 56.0646 37.9136L56.6752 43.4592Z"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </Svg>
  )
}
