import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  size?: number
  color?: string
}

export function PlaySmallIcon({ size = 8, color = '#B70061' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 8 8" fill="none">
      <Path
        d="M1.40234 0.74707C1.96662 0.418016 2.64376 0.417928 3.20801 0.74707L3.21094 0.748047L6.11035 2.41797C6.68479 2.74847 7.01555 3.33017 7 3.9834V3.99512C6.99996 4.65493 6.66652 5.23025 6.10059 5.56152L3.2002 7.23145L3.19824 7.2334C2.91698 7.39747 2.61395 7.47461 2.2998 7.47461C1.99475 7.47458 1.68249 7.39671 1.40234 7.2334C0.835876 6.90296 0.500014 6.31709 0.5 5.66504V2.31543L0.503906 2.19238C0.542647 1.58323 0.870212 1.05748 1.40234 0.74707Z"
        fill={color}
        stroke={color}
      />
    </Svg>
  )
}
