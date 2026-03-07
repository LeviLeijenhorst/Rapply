import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "../../../ui/Text";
import { colors } from "../../../design/theme/colors";
import { brandColors, fontSizes, radius, spacing } from "../../theme/tokens";

type Props = {
  label: string;
  isSelected: boolean;
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
};

// Renders a shared segmented tab button with selected and hover styling.
export function SegmentedTabButton({
  label,
  isSelected,
  icon,
  onPress,
}: Props) {
  const iconColor = isSelected ? brandColors.white : colors.selected;
  const textColor = isSelected ? brandColors.white : colors.selected;

  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.tabButton,
        isSelected ? styles.tabButtonSelected : styles.tabButtonUnselected,
        hovered
          ? isSelected
            ? styles.tabButtonSelectedHovered
            : styles.tabButtonHovered
          : undefined,
      ]}
    >
      <View style={styles.tabButtonContent}>
        {icon(iconColor)}
        <Text isSemibold style={[styles.tabLabel, { color: textColor }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    height: 40,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  tabButtonSelected: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  tabButtonSelectedHovered: {
    backgroundColor: brandColors.primaryHover,
    borderColor: brandColors.primaryHover,
  },
  tabButtonUnselected: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  tabButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  tabButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  tabLabel: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
});


