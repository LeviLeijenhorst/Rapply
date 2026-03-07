import React, { useEffect, useRef } from 'react'
import { Animated, Easing, StyleProp, StyleSheet, ViewStyle } from 'react-native'
import Svg, { Rect } from 'react-native-svg'
import { colors } from '../design/theme/colors'

type SpinnerSize = 'small' | 'large'

type Props = {
  size?: SpinnerSize | number
  color?: string
  style?: StyleProp<ViewStyle>
}

function resolveSize(size: SpinnerSize | number | undefined) {
  if (typeof size === 'number') return size
  if (size === 'large') return 32
  return 25
}

export function LoadingSpinner({ size = 'small', color = colors.selected, style }: Props) {
  const rotateValue = useRef(new Animated.Value(0)).current
  const resolvedSize = resolveSize(size)

  useEffect(() => {
    rotateValue.setValue(0)
    const spinLoop = Animated.loop(
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    )
    spinLoop.start()
    return () => spinLoop.stop()
  }, [rotateValue])

  const rotate = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={[styles.root, { width: resolvedSize, height: resolvedSize, transform: [{ rotate }] }, style]}>
      <Svg width={resolvedSize} height={resolvedSize} viewBox="0 0 25 25" fill="none">
        <Rect opacity={1} x={0.0608628} y={0.0361309} width={18.4339} height={17.67} rx={4.95} transform="matrix(0.969235 -0.246136 0.248021 0.968755 1.30736 6.18966)" stroke={color} strokeWidth={0.2} />
        <Rect opacity={1} x={0.0684998} y={0.0180405} width={18.4195} height={17.684} rx={4.95} transform="matrix(0.864766 -0.502175 0.50523 0.862985 0.000148883 9.51323)" stroke={color} strokeWidth={0.2} />
        <Rect opacity={1} x={0.0688055} y={-0.0168472} width={18.3836} height={17.7185} rx={4.95} transform="matrix(0.520189 -0.854051 0.85592 0.517108 0.114816 15.8366)" stroke={color} strokeWidth={0.2} />
        <Rect opacity={1} x={0.0590186} y={-0.0390481} width={18.3663} height={17.7351} rx={4.95} transform="matrix(0.200325 -0.97973 0.980047 0.198768 1.99562 19.8)" stroke={color} strokeWidth={0.2} />
        <Rect opacity={1} x={0.046196} y={-0.0535067} width={18.3637} height={17.7375} rx={4.95} transform="matrix(-0.0734244 -0.997301 0.997344 -0.0728332 4.38518 22.3452)" stroke={color} strokeWidth={0.2} />
      </Svg>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})

