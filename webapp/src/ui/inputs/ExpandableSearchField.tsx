import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  ViewStyle,
} from "react-native";

import { AnimatedWidthContainer } from "../../ui/AnimatedWidthContainer";
import { SearchIcon } from "../../icons/SearchIcon";
import { Text } from "../../ui/Text";
import { colors } from "../../design/theme/colors";
import { brandColors } from "../../design/tokens/colors";
import { fontSizes } from "../../design/tokens/fontSizes";
import { radius } from "../../design/tokens/radius";
import { spacing } from "../../design/tokens/spacing";
import { SearchField } from "./SearchField";

type Props = {
  isExpanded: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onExpand: () => void;
  onBlur?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
  collapsedLabel?: string;
  expandedWidth?: number;
  collapsedWidth?: number;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

// Renders a compact search trigger that expands into a full search input when active.
export function ExpandableSearchField({
  isExpanded,
  value,
  onChangeText,
  placeholder,
  onExpand,
  onBlur,
  inputRef,
  collapsedLabel = "Zoeken",
  expandedWidth = 315,
  collapsedWidth = 138,
  containerStyle,
  inputStyle,
}: Props) {
  return (
    <AnimatedWidthContainer
      width={isExpanded ? expandedWidth : collapsedWidth}
      style={containerStyle}
    >
      {isExpanded ? (
        <SearchField
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          onBlur={onBlur}
          inputRef={inputRef}
          inputStyle={inputStyle}
        />
      ) : (
        <Pressable
          onPress={onExpand}
          style={({ hovered }) => [
            styles.collapsedButton,
            hovered ? styles.collapsedButtonHovered : undefined,
          ]}
        >
          <SearchIcon color={brandColors.neutral700} size={18} />
          <Text isBold style={styles.collapsedButtonText}>
            {collapsedLabel}
          </Text>
        </Pressable>
      )}
    </AnimatedWidthContainer>
  );
}

const styles = StyleSheet.create({
  collapsedButton: {
    width: "100%",
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  collapsedButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  collapsedButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: brandColors.neutral700,
  },
});



