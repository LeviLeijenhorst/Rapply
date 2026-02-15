import React from "react";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { SearchIcon } from "../../../components/icons/SearchIcon";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { brandColors, fontSizes, radius, spacing } from "../../theme/tokens";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  inputRef?: React.RefObject<TextInput | null>;
  onBlur?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  placeholderTextColor?: string;
};

const inputWebStyle = {
  outlineStyle: "none",
  outlineWidth: 0,
  outlineColor: "transparent",
} as any;

// Renders the shared search input shell used across screens and modals.
export function SearchField({
  value,
  onChangeText,
  placeholder,
  inputRef,
  onBlur,
  containerStyle,
  inputStyle,
  placeholderTextColor = brandColors.neutral700,
}: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      <SearchIcon color={brandColors.neutral700} size={18} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        onBlur={onBlur}
        style={[styles.input, inputWebStyle, inputStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...({ overflow: "hidden" } as any),
  },
  input: {
    flex: 1,
    fontSize: fontSizes.sm,
    lineHeight: 18,
    fontFamily: typography.fontFamilyMedium,
    color: brandColors.neutral700,
    padding: 0,
  },
});
