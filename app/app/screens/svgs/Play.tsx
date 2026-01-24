import React from "react"
import Svg, { Path } from "react-native-svg"
import { colors } from "../constants"

export default function Play({ color = colors.textPrimary, size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 24" fill="none">
      {/** Rounded triangle using quadratic curves on corners */}
      <Path
        d="M3.13077 0.262851C2.475 -0.101424 1.68173 -0.0853531 1.03654 0.30035C0.391346 0.686052 0 1.38782 0 2.14315V21.8568C0 22.6122 0.396635 23.3139 1.03654 23.6997C1.67644 24.0854 2.475 24.1014 3.13077 23.7371L20.9 13.8803C21.5769 13.5053 22 12.7821 22 12C22 11.2179 21.5769 10.4947 20.9 10.1197L3.13077 0.262851Z"
        fill={color}
      />
    </Svg>
  )
}
