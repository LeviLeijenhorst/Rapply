import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function TemplateEditIcon({ color, size = 24 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.04 3.02025L8.16 10.9003C7.86 11.2003 7.56 11.7903 7.5 12.2203L7.07 15.2303C6.91 16.3203 7.68 17.0803 8.77 16.9303L11.78 16.5003C12.2 16.4403 12.79 16.1403 13.1 15.8403L20.98 7.96025C22.34 6.60025 22.98 5.02025 20.98 3.02025C18.98 1.02025 17.4 1.66025 16.04 3.02025Z"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.91 4.15039C15.58 6.54039 17.45 8.41039 19.85 9.09039"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
