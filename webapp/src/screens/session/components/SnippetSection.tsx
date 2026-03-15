import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native'

import { semanticColorTokens, brandColors } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { InputThumbsDownIcon, InputThumbsUpIcon } from '@/icons/InputPageIcons'
import { ModalCloseDarkIcon } from '@/icons/ModalCloseDarkIcon'
import { RotateLeftIcon } from '@/icons/RotateLeftIcon'
import { TrashIcon } from '@/icons/TrashIcon'
import type { SnippetSectionProps } from '@/screens/session/sessionScreen.types'
import type { SnippetStatus } from '@/storage/types'
import { LoadingSpinner } from '@/ui/LoadingSpinner'
import { Text } from '@/ui/Text'
import { Modal } from '@/ui/animated/Modal'

if (Platform.OS === 'android' && (UIManager as any).setLayoutAnimationEnabledExperimental) {
  ;(UIManager as any).setLayoutAnimationEnabledExperimental(true)
}

function resolveSnippetBorderColor(status: SnippetStatus): string {
  if (status === 'rejected') return semanticColorTokens.light.danger
  if (status === 'approved') return semanticColorTokens.light.success
  return semanticColorTokens.light.panelBorder
}

export function SnippetSection({
  snippets,
  isLoading = false,
  canRegenerate = false,
  isRegenerating = false,
  onRegenerate,
  onUpdateSnippetStatus,
  onDeleteSnippet,
}: SnippetSectionProps) {
  const [snippetIdPendingDelete, setSnippetIdPendingDelete] = useState<string | null>(null)
  const sortedSnippets = useMemo(
    () => [...snippets].sort((leftSnippet, rightSnippet) => leftSnippet.createdAtUnixMs - rightSnippet.createdAtUnixMs),
    [snippets],
  )
  const previousSnippetCountRef = useRef(sortedSnippets.length)

  useEffect(() => {
    if (sortedSnippets.length > previousSnippetCountRef.current) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    }
    previousSnippetCountRef.current = sortedSnippets.length
  }, [sortedSnippets.length])

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text isBold style={styles.heading}>Selecteer wat bewaard blijft</Text>
        <View style={styles.headerActionsRow}>
          {canRegenerate && !isLoading ? (
            sortedSnippets.length > 0 ? (
              <Pressable
                disabled={isRegenerating}
                onPress={onRegenerate}
                style={({ hovered }) => [
                  styles.headerIconButton,
                  hovered && !isRegenerating ? styles.headerIconButtonHover : undefined,
                  isRegenerating ? styles.disabledButton : undefined,
                ]}
              >
                {isRegenerating ? <ActivityIndicator size="small" color={brandColors.primary} /> : <RotateLeftIcon color={brandColors.primary} size={16} />}
              </Pressable>
            ) : (
              <Pressable
                disabled={isRegenerating}
                onPress={onRegenerate}
                style={({ hovered }) => [
                  styles.headerActionButton,
                  hovered && !isRegenerating ? styles.headerActionButtonHover : undefined,
                  isRegenerating ? styles.disabledButton : undefined,
                ]}
              >
                <Text style={styles.headerActionText}>{isRegenerating ? 'Snippets genereren...' : 'Snippets genereren'}</Text>
              </Pressable>
            )
          ) : null}
          {sortedSnippets.length > 0 ? (
            <Pressable
              onPress={() => {
                sortedSnippets.forEach((snippet) => {
                  if (snippet.status !== 'approved') onUpdateSnippetStatus(snippet.id, 'approved')
                })
              }}
              style={({ hovered }) => [styles.headerActionButton, hovered ? styles.headerActionButtonHover : undefined]}
            >
              <View style={styles.headerActionContent}>
                <InputThumbsUpIcon size={14} />
                <Text style={styles.headerActionText}>Alles goedkeuren</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </View>

      {sortedSnippets.length === 0 && isLoading ? (
        <View style={styles.loadingOnly}>
          <LoadingSpinner size="small" />
          <Text style={styles.emptyText}>Snippets worden gegenereerd...</Text>
        </View>
      ) : null}

      {sortedSnippets.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nog geen snippets in deze sessie.</Text>
        </View>
      ) : null}

      {sortedSnippets.length > 0 ? (
        <View style={styles.list}>
          {sortedSnippets.map((snippet) => (
            <View key={snippet.id} style={[styles.snippetCard, { borderColor: resolveSnippetBorderColor(snippet.status) }]}> 
              <View style={styles.contentRow}>
                <Text style={styles.snippetText}>{snippet.text}</Text>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'approved')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'approved' ? styles.iconApprove : styles.iconNeutral,
                      hovered ? (snippet.status === 'approved' ? styles.iconApproveHover : styles.iconNeutralHover) : undefined,
                    ]}
                  >
                    <InputThumbsUpIcon size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'rejected')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'rejected' ? styles.iconReject : styles.iconNeutral,
                      hovered ? (snippet.status === 'rejected' ? styles.iconRejectHover : styles.iconNeutralHover) : undefined,
                    ]}
                  >
                    <InputThumbsDownIcon size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => setSnippetIdPendingDelete(snippet.id)}
                    style={({ hovered }) => [styles.iconButton, styles.iconNeutral, hovered ? styles.iconNeutralHover : undefined]}
                  >
                    <TrashIcon size={16} color={semanticColorTokens.light.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Modal visible={Boolean(snippetIdPendingDelete)} onClose={() => setSnippetIdPendingDelete(null)} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text isBold style={styles.modalTitle}>
            Snippet verwijderen
          </Text>
          <Pressable onPress={() => setSnippetIdPendingDelete(null)} style={({ hovered }) => [styles.modalCloseButton, hovered ? styles.modalCloseButtonHover : undefined]}>
            <ModalCloseDarkIcon />
          </Pressable>
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.modalBodyText}>Weet je zeker dat je deze snippet wilt verwijderen?</Text>
        </View>
        <View style={styles.modalFooter}>
          <Pressable onPress={() => setSnippetIdPendingDelete(null)} style={({ hovered }) => [styles.modalCancelButton, hovered ? styles.modalCancelButtonHover : undefined]}>
            <Text isBold style={styles.modalCancelButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!snippetIdPendingDelete) return
              onDeleteSnippet(snippetIdPendingDelete)
              setSnippetIdPendingDelete(null)
            }}
            style={({ hovered }) => [styles.modalDeleteButton, hovered ? styles.modalDeleteButtonHover : undefined]}
          >
            <Text isBold style={styles.modalDeleteButtonText}>
              Verwijderen
            </Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  heading: {
    fontSize: fontSizes.lg,
    lineHeight: 24,
    color: semanticColorTokens.light.textHeading,
  },
  headerActionButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  headerActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs + 2,
  },
  headerIconButton: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  headerIconButtonHover: {
    backgroundColor: semanticColorTokens.light.badgeBackground,
  },
  headerActionButtonHover: {
    backgroundColor: semanticColorTokens.light.badgeBackground,
  },
  headerActionText: {
    fontSize: fontSizes.md,
    lineHeight: 20,
    color: brandColors.primary,
  },
  emptyState: {
    gap: spacing.xxs,
  },
  loadingOnly: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  loadingState: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
  },
  emptyText: {
    color: semanticColorTokens.light.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 21,
  },
  disabledButton: {
    opacity: 0.55,
  },
  list: {
    gap: spacing.sm,
  },
  snippetCard: {
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    backgroundColor: semanticColorTokens.light.elevatedSurface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    ...rnShadows.card,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNeutral: {
    backgroundColor: semanticColorTokens.light.neutralSurface,
  },
  iconNeutralHover: {
    backgroundColor: semanticColorTokens.light.hoverNeutral,
  },
  iconApprove: {
    backgroundColor: semanticColorTokens.light.successBackground,
  },
  iconApproveHover: {
    backgroundColor: '#B8F5D4',
  },
  iconReject: {
    backgroundColor: semanticColorTokens.light.dangerBackground,
  },
  iconRejectHover: {
    backgroundColor: '#F9C1C1',
  },
  snippetText: {
    flex: 1,
    alignSelf: 'center',
    color: semanticColorTokens.light.textBody,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  modalContainer: {
    width: 640,
    maxWidth: '90vw',
    backgroundColor: semanticColorTokens.light.surface,
    borderRadius: radius.lg,
    ...( { boxShadow: '0 2px 8px rgba(0,0,0,0.04)' } as any ),
    overflow: 'hidden',
  },
  modalHeader: {
    width: '100%',
    height: 72,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    lineHeight: 22,
    color: semanticColorTokens.light.textStrong,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverBackground,
  },
  modalBody: {
    width: '100%',
    padding: 24,
    gap: spacing.sm,
  },
  modalBodyText: {
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: semanticColorTokens.light.textStrong,
  },
  modalFooter: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: borderWidths.hairline,
    borderTopColor: semanticColorTokens.light.border,
  },
  modalCancelButton: {
    height: 48,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: semanticColorTokens.light.surface,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverBackground,
  },
  modalCancelButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: semanticColorTokens.light.textStrong,
  },
  modalDeleteButton: {
    height: 48,
    borderBottomRightRadius: radius.lg,
    backgroundColor: brandColors.primary,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDeleteButtonHover: {
    backgroundColor: brandColors.primaryHover,
  },
  modalDeleteButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: brandColors.white,
  },
})
