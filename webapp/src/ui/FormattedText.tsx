import React from 'react'

import { Text } from './Text'

type Props = {
  text: string
  textStyle?: any
  boldStyle?: any
  numberOfLines?: number
}

export function FormattedText({ text, textStyle, boldStyle, numberOfLines }: Props) {
  const segments = String(text || '').split('**')
  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {/* Formatted text */}
      {segments.map((segment, index) => (
        <Text key={`${index}-${segment}`} isBold={index % 2 === 1} style={index % 2 === 1 ? boldStyle : undefined}>
          {segment}
        </Text>
      ))}
    </Text>
  )
}
