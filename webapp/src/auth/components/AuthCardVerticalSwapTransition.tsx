import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

type Props = {
  contentKey: string
  render: (contentKey: string) => React.ReactNode
}

export function AuthCardVerticalSwapTransition({ contentKey, render }: Props) {
  const [activeKey, setActiveKey] = useState(contentKey)
  const [previousKey, setPreviousKey] = useState<string | null>(null)

  const progress = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (contentKey === activeKey) return

    setPreviousKey(activeKey)
    setActiveKey(contentKey)
    progress.setValue(0)

    Animated.timing(progress, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPreviousKey(null)
    })
  }, [activeKey, contentKey, progress])

  const incomingTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-36, 0],
  })

  const outgoingTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 36],
  })

  const incomingOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  })

  const outgoingOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  })

  return (
    <View style={styles.container}>
      {/* Outgoing card */}
      {previousKey ? (
        <Animated.View style={[styles.layer, styles.outgoingLayer, { opacity: outgoingOpacity, transform: [{ translateY: outgoingTranslateY }] }]}>
          {render(previousKey)}
        </Animated.View>
      ) : null}

      {/* Incoming card */}
      <Animated.View style={[styles.layer, styles.incomingLayer, { opacity: incomingOpacity, transform: [{ translateY: incomingTranslateY }] }]}>
        {render(activeKey)}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    ...( { position: 'relative', overflow: 'hidden' } as any ),
  },
  layer: {
    width: '100%',
    height: '100%',
  },
  outgoingLayer: {
    ...( { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as any ),
    zIndex: 1,
  },
  incomingLayer: {
    zIndex: 2,
  },
})

