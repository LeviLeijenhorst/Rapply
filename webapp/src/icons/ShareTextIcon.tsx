import React from 'react'
import Svg, { Path } from 'react-native-svg'

type Props = {
  color: string
  size?: number
}

export function ShareTextIcon({ color, size = 18 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M1.5 6.75C1.5 3 3 1.5 6.75 1.5H10.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16.5 7.5V11.25C16.5 15 15 16.5 11.25 16.5H6.75C3 16.5 1.5 15 1.5 11.25V9.735" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M13.5 7.5C11.25 7.5 10.5 6.75 10.5 4.5V1.5L16.5 7.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7.32102 14L6.12784 9.63636H6.66477L7.5767 13.1903H7.61932L8.5483 9.63636H9.14489L10.0739 13.1903H10.1165L11.0284 9.63636H11.5653L10.3722 14H9.8267L8.86364 10.5227H8.82955L7.86648 14H7.32102Z" fill={color} />
    </Svg>
  )
}

