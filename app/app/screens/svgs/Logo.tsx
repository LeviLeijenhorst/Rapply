import React from "react"
import CoachScribeLogo from "./CoachScribe.svg"

export default function Logo({ width = 300, height = 90 }: { width?: number; height?: number }) {
  return <CoachScribeLogo width={width} height={height} />
}
