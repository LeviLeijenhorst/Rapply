import React, { useEffect, useRef, useState } from 'react'
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native'

import { colors } from '../../../design/theme/colors'
import { webTransitionSmooth } from '../../../design/theme/transitions'
import { fontSizes } from '../../../design/tokens/fontSizes'
import { radius } from '../../../design/tokens/radius'
import { spacing } from '../../../design/tokens/spacing'
import { NotitiesSessieIcon } from '../../../icons/NotitiesSessieIcon'
import { Text } from '../../../ui/Text'
import { ClientTabIndicator } from '../../client/components/ClientTabIndicator'
import { SessionDecorativeShapeIcon } from './SessionIcons'

type Props = {
  activeTab: 'ai' | 'notes'
  onTabChange: (tab: 'ai' | 'notes') => void
}

export function SessionTabs({ activeTab, onTabChange }: Props) {
  const [containerWidth, setContainerWidth] = useState(389)
  const tabWidth = Math.max(120, containerWidth / 2)
  const indicatorTranslateX = useRef(new Animated.Value(activeTab === 'ai' ? 0 : tabWidth)).current

  useEffect(() => {
    Animated.timing(indicatorTranslateX, {
      toValue: activeTab === 'ai' ? 0 : tabWidth,
      duration: 180,
      useNativeDriver: true,
    }).start()
  }, [activeTab, indicatorTranslateX, tabWidth])

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width
    if (nextWidth > 0 && Math.abs(nextWidth - containerWidth) > 1) {
      setContainerWidth(nextWidth)
    }
  }

  return (
    <View style={styles.tabsRow} onLayout={handleLayout}>
      <Animated.View style={[styles.indicatorWrap, { width: tabWidth, transform: [{ translateX: indicatorTranslateX }] }]}>
        <ClientTabIndicator style={styles.indicator} />
      </Animated.View>

      <Pressable
        onPress={() => onTabChange('ai')}
        style={({ hovered }) => [
          styles.tabButton,
          styles.tabButtonFill,
          activeTab === 'ai' ? styles.tabButtonSelected : styles.tabButtonUnselected,
          webTransitionSmooth,
          hovered ? (activeTab === 'ai' ? styles.tabButtonSelectedHovered : styles.tabButtonHovered) : undefined,
        ]}
      >
        <View style={styles.tabButtonContent}>
          <SessionDecorativeShapeIcon size={14} />
          <Text isSemibold style={[styles.tabText, activeTab === 'ai' ? styles.tabTextActive : undefined]}>AI-chat</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onTabChange('notes')}
        style={({ hovered }) => [
          styles.tabButton,
          styles.tabButtonFill,
          activeTab === 'notes' ? styles.tabButtonSelected : styles.tabButtonUnselected,
          webTransitionSmooth,
          hovered ? (activeTab === 'notes' ? styles.tabButtonSelectedHovered : styles.tabButtonHovered) : undefined,
        ]}
      >
        <View style={styles.tabButtonContent}>
          <NotitiesSessieIcon color={activeTab === 'notes' ? colors.selected : '#2C111F'} size={16} />
          <Text isSemibold style={[styles.tabText, activeTab === 'notes' ? styles.tabTextActive : undefined]}>Notities</Text>
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  tabsRow: {
    width: '100%',
    maxWidth: 389,
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#DFE0E2',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  indicatorWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    padding: 2,
  },
  indicator: {
    flex: 1,
    backgroundColor: '#FCEFF6',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#EEC2DA',
  },
  tabButton: {
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
  },
  tabButtonFill: {
    flex: 1,
    minWidth: 120,
  },
  tabButtonSelected: {
    backgroundColor: 'transparent',
  },
  tabButtonSelectedHovered: {
    opacity: 0.92,
  },
  tabButtonUnselected: {
    backgroundColor: 'transparent',
  },
  tabButtonHovered: {
    backgroundColor: '#FAFAFA',
  },
  tabButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tabText: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: '#2C111F',
  },
  tabTextActive: {
    color: colors.selected,
  },
})
