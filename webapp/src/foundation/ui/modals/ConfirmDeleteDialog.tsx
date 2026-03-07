import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  fontSizes,
  radius,
  shadows,
  spacing,
  brandColors,
} from "../../theme/tokens";
import { colors } from "../../../design/theme/colors";
import { Text } from "../../../ui/Text";
import { AnimatedOverlayModal } from "../../../ui/AnimatedOverlayModal";
import { ModalCloseDarkIcon } from "../../../icons/ModalCloseDarkIcon";

type Props = {
  visible: boolean;
  title: string;
  description: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
};

// Renders the shared destructive-confirmation modal used across feature-specific delete flows.
export function ConfirmDeleteDialog({
  visible,
  title,
  description,
  onClose,
  onConfirm,
  confirmLabel = "Verwijderen",
  cancelLabel = "Annuleren",
}: Props) {
  if (!visible) return null;

  return (
    <AnimatedOverlayModal
      visible={visible}
      onClose={onClose}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text isBold style={styles.headerTitle}>
          {title}
        </Text>
        <Pressable
          onPress={onClose}
          style={({ hovered }) => [
            styles.iconButton,
            hovered ? styles.iconButtonHovered : undefined,
          ]}
        >
          <ModalCloseDarkIcon />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.descriptionText}>{description}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable
          onPress={onClose}
          style={({ hovered }) => [
            styles.footerSecondaryButton,
            hovered ? styles.footerSecondaryButtonHovered : undefined,
          ]}
        >
          <Text isBold style={styles.footerSecondaryButtonText}>
            {cancelLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          style={({ hovered }) => [
            styles.footerDangerButton,
            hovered ? styles.footerDangerButtonHovered : undefined,
          ]}
        >
          <Text isBold style={styles.footerDangerButtonText}>
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 640,
    maxWidth: "90vw",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...({ boxShadow: shadows.modal } as any),
    overflow: "hidden",
  },
  header: {
    width: "100%",
    height: 72,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  body: {
    width: "100%",
    padding: spacing.lg,
  },
  descriptionText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: colors.textStrong,
  },
  footer: {
    width: "100%",
    padding: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerSecondaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: "transparent",
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  footerSecondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  footerSecondaryButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: colors.textStrong,
  },
  footerDangerButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.selected,
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  footerDangerButtonHovered: {
    backgroundColor: brandColors.primaryHover,
  },
  footerDangerButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: brandColors.white,
  },
});


