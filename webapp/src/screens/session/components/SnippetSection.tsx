import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, StyleSheet, TextInput, UIManager, View } from 'react-native'

import { semanticColorTokens, brandColors } from '@/design/tokens/colors'
import { borderWidths } from '@/design/tokens/borderWidths'
import { fontSizes } from '@/design/tokens/fontSizes'
import { radius } from '@/design/tokens/radius'
import { rnShadows } from '@/design/tokens/shadows'
import { spacing } from '@/design/tokens/spacing'
import { InputEditIcon, InputThumbsDownIcon, InputThumbsUpIcon } from '@/icons/InputPageIcons'
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

const DASHBOARD_RECORD_VIDEO_GREEN = '#0F7E3A'
const DASHBOARD_IMPORT_DOCUMENT_RED = '#9C0154'

function resolveSnippetBorderColor(status: SnippetStatus): string {
  if (status === 'rejected') return DASHBOARD_IMPORT_DOCUMENT_RED
  if (status === 'approved') return DASHBOARD_RECORD_VIDEO_GREEN
  return semanticColorTokens.light.panelBorder
}

export function SnippetSection({
  snippets,
  isLoading = false,
  canRegenerate = false,
  isRegenerating = false,
  onRegenerate,
  onCreateSnippet,
  onUpdateSnippetStatus,
  onSaveSnippetText,
  onDeleteSnippet,
}: SnippetSectionProps) {
  const [snippetIdPendingDelete, setSnippetIdPendingDelete] = useState<string | null>(null)
  const [snippetIdBeingEdited, setSnippetIdBeingEdited] = useState<string | null>(null)
  const [isCreateSnippetModalOpen, setIsCreateSnippetModalOpen] = useState(false)
  const [createSnippetDraftText, setCreateSnippetDraftText] = useState('')
  const [isCreateSnippetInputFocused, setIsCreateSnippetInputFocused] = useState(false)
  const [draftSnippetText, setDraftSnippetText] = useState('')
  const createSnippetInputRef = useRef<TextInput | null>(null)
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

  useEffect(() => {
    if (!isCreateSnippetModalOpen) {
      setIsCreateSnippetInputFocused(false)
      return undefined
    }
    const focusTimer = setTimeout(() => createSnippetInputRef.current?.focus(), 120)
    return () => clearTimeout(focusTimer)
  }, [isCreateSnippetModalOpen])

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text isBold style={styles.heading}>Selecteer wat bewaard blijft</Text>
        <View style={styles.headerActionsRow}>
          <Pressable
            onPress={() => setIsCreateSnippetModalOpen(true)}
            style={({ hovered }) => [styles.headerActionButton, hovered ? styles.iconButtonHover : undefined]}
          >
            <Text style={styles.headerActionText}>Snippet toevoegen</Text>
          </Pressable>
          {canRegenerate && !isLoading ? (
            sortedSnippets.length > 0 ? (
              <Pressable
                disabled={isRegenerating}
                onPress={onRegenerate}
                style={({ hovered }) => [
                  styles.headerIconButton,
                  hovered && !isRegenerating ? styles.iconButtonHover : undefined,
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
                  hovered && !isRegenerating ? styles.iconButtonHover : undefined,
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
              style={({ hovered }) => [styles.headerActionButton, hovered ? styles.iconButtonHover : undefined]}
            >
              <View style={styles.headerActionContent}>
                <InputThumbsUpIcon size={18} color={brandColors.primary} />
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
            <View
              key={snippet.id}
              style={[
                styles.snippetCard,
                { borderColor: resolveSnippetBorderColor(snippet.status) },
                snippet.status === 'rejected' ? styles.snippetCardRejected : undefined,
              ]}
            >
              <View style={styles.contentRow}>
                <View style={styles.snippetTextWrap}>
                  <View style={styles.snippetTextInner}>
                    <Text style={[styles.snippetText, snippet.status === 'rejected' ? styles.snippetTextRejected : undefined]}>{snippet.text}</Text>
                    {snippet.status === 'rejected' ? <View pointerEvents="none" style={styles.snippetTextStrike} /> : null}
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => {
                      setSnippetIdBeingEdited(snippet.id)
                      setDraftSnippetText(snippet.text)
                    }}
                    style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHover : undefined]}
                  >
                    <InputEditIcon size={18} />
                  </Pressable>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'approved')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'approved' ? styles.iconButtonSelected : undefined,
                      hovered ? styles.iconButtonHover : undefined,
                    ]}
                  >
                    <InputThumbsUpIcon size={18} color={brandColors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => onUpdateSnippetStatus(snippet.id, 'rejected')}
                    style={({ hovered }) => [
                      styles.iconButton,
                      snippet.status === 'rejected' ? styles.iconButtonSelected : undefined,
                      hovered ? styles.iconButtonHover : undefined,
                    ]}
                  >
                    <InputThumbsDownIcon size={18} color={brandColors.primary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setSnippetIdPendingDelete(snippet.id)}
                    style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHover : undefined]}
                  >
                    <TrashIcon size={16} color={semanticColorTokens.light.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Modal visible={Boolean(snippetIdBeingEdited)} onClose={() => setSnippetIdBeingEdited(null)} contentContainerStyle={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text isBold style={styles.modalTitle}>
            Snippet bewerken
          </Text>
          <Pressable onPress={() => setSnippetIdBeingEdited(null)} style={({ hovered }) => [styles.modalCloseButton, hovered ? styles.modalCloseButtonHover : undefined]}>
            <ModalCloseDarkIcon />
          </Pressable>
        </View>
        <View style={styles.modalBody}>
          <TextInput
            value={draftSnippetText}
            onChangeText={setDraftSnippetText}
            placeholder="Schrijf of bewerk de snippet..."
            placeholderTextColor={semanticColorTokens.light.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.modalEditorInput}
          />
        </View>
        <View style={styles.modalFooter}>
          <Pressable onPress={() => setSnippetIdBeingEdited(null)} style={({ hovered }) => [styles.modalCancelButton, hovered ? styles.modalCancelButtonHover : undefined]}>
            <Text isBold style={styles.modalCancelButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!snippetIdBeingEdited) return
              onSaveSnippetText(snippetIdBeingEdited, draftSnippetText)
              setSnippetIdBeingEdited(null)
            }}
            style={({ hovered }) => [styles.modalSaveButton, hovered ? styles.modalSaveButtonHover : undefined]}
          >
            <Text isBold style={styles.modalSaveButtonText}>
              Opslaan
            </Text>
          </Pressable>
        </View>
      </Modal>

      <Modal
        visible={isCreateSnippetModalOpen}
        onClose={() => {
          setIsCreateSnippetModalOpen(false)
          setCreateSnippetDraftText('')
        }}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalHeader}>
          <Text isBold style={styles.modalTitle}>
            Snippet toevoegen
          </Text>
          <Pressable
            onPress={() => {
              setIsCreateSnippetModalOpen(false)
              setCreateSnippetDraftText('')
            }}
            style={({ hovered }) => [styles.modalCloseButton, hovered ? styles.modalCloseButtonHover : undefined]}
          >
            <ModalCloseDarkIcon />
          </Pressable>
        </View>
        <View style={styles.modalBody}>
          <TextInput
            ref={(nextValue) => {
              createSnippetInputRef.current = nextValue
            }}
            value={createSnippetDraftText}
            onChangeText={setCreateSnippetDraftText}
            onFocus={() => setIsCreateSnippetInputFocused(true)}
            onBlur={() => setIsCreateSnippetInputFocused(false)}
            placeholder="Schrijf de nieuwe snippet..."
            placeholderTextColor={semanticColorTokens.light.textMuted}
            multiline
            textAlignVertical="top"
            style={[styles.modalEditorInput, isCreateSnippetInputFocused ? styles.modalEditorInputFocused : undefined]}
          />
        </View>
        <View style={styles.modalFooter}>
          <Pressable
            onPress={() => {
              setIsCreateSnippetModalOpen(false)
              setCreateSnippetDraftText('')
            }}
            style={({ hovered }) => [styles.modalCancelButton, hovered ? styles.modalCancelButtonHover : undefined]}
          >
            <Text isBold style={styles.modalCancelButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const nextSnippetText = createSnippetDraftText.trim()
              if (!nextSnippetText) return
              onCreateSnippet(nextSnippetText)
              setIsCreateSnippetModalOpen(false)
              setCreateSnippetDraftText('')
            }}
            style={({ hovered }) => [styles.modalSaveButton, hovered ? styles.modalSaveButtonHover : undefined]}
          >
            <Text isBold style={styles.modalSaveButtonText}>
              Toevoegen
            </Text>
          </Pressable>
        </View>
      </Modal>

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
    fontSize: fontSizes.md,
    lineHeight: 22,
    color: semanticColorTokens.light.textHeading,
  },
  headerActionButton: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
  },
  iconButtonHover: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
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
  snippetCardRejected: {
    opacity: 0.58,
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
    backgroundColor: 'transparent',
  },
  iconButtonSelected: {
    backgroundColor: semanticColorTokens.light.hoverAccent,
  },
  snippetText: {
    alignSelf: 'center',
    color: semanticColorTokens.light.textBody,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  snippetTextWrap: {
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  snippetTextInner: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    position: 'relative',
  },
  snippetTextRejected: {
    textDecorationLine: 'none',
  },
  snippetTextStrike: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: semanticColorTokens.light.textBody,
    opacity: 0.72,
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
  modalEditorInput: {
    minHeight: 320,
    borderRadius: radius.md,
    borderWidth: borderWidths.hairline,
    borderColor: semanticColorTokens.light.border,
    backgroundColor: semanticColorTokens.light.pageBackground,
    padding: spacing.md,
    fontSize: fontSizes.md,
    lineHeight: 24,
    color: semanticColorTokens.light.textBody,
  },
  modalEditorInputFocused: {
    borderColor: 'transparent',
    ...( { outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any ),
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
  modalSaveButton: {
    height: 48,
    borderBottomRightRadius: radius.lg,
    backgroundColor: semanticColorTokens.light.selected,
    paddingHorizontal: spacing.lg,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveButtonHover: {
    backgroundColor: '#A50058',
  },
  modalSaveButtonText: {
    fontSize: fontSizes.sm,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
