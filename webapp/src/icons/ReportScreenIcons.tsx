import React from 'react'
import Svg, { Path } from 'react-native-svg'

type IconProps = {
  size?: number
}

type CloudIconProps = {
  size?: number
  color?: string
}

export function ReportSessiesIcon({ size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path d="M13.8523 12.6225L14.1448 14.9925C14.2198 15.615 13.5523 16.05 13.0198 15.7275L10.4248 14.1825C10.2448 14.0775 10.1998 13.8525 10.2973 13.6725C10.6723 12.9825 10.8748 12.2025 10.8748 11.4225C10.8748 8.6775 8.5198 6.4425 5.6248 6.4425C5.0323 6.4425 4.4548 6.5325 3.9148 6.7125C3.6373 6.8025 3.3673 6.5475 3.4348 6.2625C4.1173 3.5325 6.7423 1.5 9.8773 1.5C13.5373 1.5 16.4998 4.2675 16.4998 7.68C16.4998 9.705 15.4573 11.4975 13.8523 12.6225Z" fill="#BE0165" />
      <Path d="M9.75 11.4224C9.75 12.3149 9.42 13.1399 8.865 13.7924C8.1225 14.6924 6.945 15.2699 5.625 15.2699L3.6675 16.4324C3.3375 16.6349 2.9175 16.3574 2.9625 15.9749L3.15 14.4974C2.145 13.7999 1.5 12.6824 1.5 11.4224C1.5 10.1024 2.205 8.93988 3.285 8.24988C3.9525 7.81488 4.755 7.56738 5.625 7.56738C7.905 7.56738 9.75 9.29238 9.75 11.4224Z" fill="#BE0165" />
    </Svg>
  )
}

export function ReportCheckIcon() {
  return (
    <Svg width={11} height={8} viewBox="0 0 11 8" fill="none">
      <Path d="M0.999983 3.52165L3.87816 6.68687L9.19104 1.00002" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

export function ReportPlusIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path d="M7 1V13M1 7H13" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  )
}

export function ReportCloseIcon() {
  return (
    <Svg width={10} height={10} viewBox="0 0 10 10" fill="none">
      <Path d="M1 1L9 9M9 1L1 9" stroke="#667085" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}

export function ReportUwvLogoIcon() {
  return (
    <Svg width={28} height={24} viewBox="0 0 75 63.3" fill="none">
      <Path fill="#0078D2" d="m75 16.9c0-3.3-1.1-6.4-2.9-9.1-8-11.5-30-10.1-49.1 3.1s-28 33.2-20 44.7 29.9 10 49-3c0.1-0.1 0-0.2-0.1-0.1-10.6 6.1-19.9 6.1-24 0s0.2-16.4 9.2-22.3c3.1-2.1 6.5-3.6 10.2-4.4l-1.2 6c-0.1 0.2 0 0.5 0.2 0.6s0.5 0.1 0.7 0l18.5-10.1c0.2-0.1 0.4-0.3 0.4-0.6 0.1-0.2 0-0.5-0.2-0.6l-14.5-9.9c-0.2-0.2-0.5-0.2-0.7-0.1s-0.4 0.3-0.4 0.6l-0.9 4.5c-6.3 0.6-12.2 2.8-17.3 6.4-12.4 8.3-17.9 21.7-12.3 30 1.5 2.2 3.7 3.8 6.1 4.8l0.4 0.1v0.1c-4.2-0.6-8-2.8-10.4-6.3-6.9-9.9 0.3-26.8 16-37.6s34-11.6 40.9-1.7c1.1 1.5 1.8 3.1 2.2 4.9v0.1c0 0.1 0.2 0.1 0.2-0.1" />
      <Path fill="#0078D2" d="m40.6 49.4v-1c-0.7 1.2-2 1.9-3.3 1.8-1.4 0-3.1-0.9-3.1-4.2v-6.7l2.3-0.4v7c-0.1 0.7 0.1 1.4 0.6 1.9 0.9 0.8 2.5 0.3 3.5-1.5v-7.1l2.3-0.4v11.2h-1.6c-0.5 0-0.8-0.2-0.7-0.6-0.1 0-0.1 0 0 0" />
      <Path fill="#0078D2" d="M65.6,46.9l2.6-7.9h2.3l-3.9,10.9V50h-1.8c-0.3,0-0.5-0.2-0.6-0.4L60.5,39h2.5L65.6,46.9z" />
      <Path fill="#0078D2" d="M51.9,42l-2.5,8h-1.8c-0.3,0-0.5-0.2-0.6-0.4L44,39h2.5l2,7.6l2.4-7.6h2.2l2.4,7.6l2-7.6h2.3l-3.1,11H55c-0.2,0-0.5-0.1-0.6-0.3L51.9,42z" />
    </Svg>
  )
}

export function ReportSavedCloudIcon({ size = 24, color = '#171717' }: CloudIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.27004 13.01C6.74004 12.74 6.15004 12.6 5.55004 12.6C0.870039 12.93 0.870039 19.74 5.55004 20.07H16.64C17.99 20.08 19.29 19.58 20.28 18.67C23.57 15.8 21.81 10.03 17.48 9.48C15.92 0.110001 2.39004 3.67 5.60004 12.6"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.8501 9.92001C16.3701 9.66001 16.9401 9.52001 17.5201 9.51001"
        stroke={color}
        strokeWidth={1.5}
        strokeMiterlimit={10}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}
