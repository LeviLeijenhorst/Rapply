import React from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { colors } from '../theme/colors'
import { Text } from './Text'

type Props = {
  label: string
}

export function SubscriptionPlanPill({ label }: Props) {
  return (
    <View style={styles.pill}>
      {/* Subscription plan icon */}
      <Svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <Path
          d="M10.0506 2.84499C10.8306 2.28499 11.2056 2.56999 10.8856 3.47499L8.86559 9.12999C8.79559 9.32999 8.56059 9.49499 8.35059 9.49499H3.65059C3.44059 9.49499 3.20559 9.32999 3.13559 9.12999L1.06559 3.33499C0.770588 2.50499 1.11559 2.24999 1.82559 2.75999L3.77559 4.15499C4.10059 4.37999 4.47059 4.26499 4.61059 3.89999L5.49059 1.55499C5.77059 0.804993 6.23559 0.804993 6.51559 1.55499L7.39559 3.89999C7.53559 4.26499 7.90559 4.37999 8.22559 4.15499L8.54059 3.92999"
          fill="none"
          stroke={colors.selected}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M3.25 11H8.75" fill="none" stroke={colors.selected} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4.75 7H7.25" fill="none" stroke={colors.selected} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {/* Subscription plan label */}
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFE9DF',
    borderWidth: 1,
    borderColor: colors.selected,
    padding: 6,
    gap: 6,
  },
  label: {
    fontSize: 12,
    lineHeight: 12,
    color: colors.selected,
  },
})

