import React from "react"
import RapplyLogo from "./Rapply.svg"

export default function Logo({ width = 300, height = 90 }: { width?: number; height?: number }) {
  return <RapplyLogo width={width} height={height} />
}
