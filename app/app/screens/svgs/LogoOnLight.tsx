import React from "react"
import CoachScribeOnLight from "./CoachScribeOnLight.svg"

export default function LogoOnLight({ width = 300, height = 90 }: { width?: number; height?: number }) {
  return <CoachScribeOnLight width={width} height={height} pointerEvents="none" />
}


