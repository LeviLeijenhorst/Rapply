import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import Svg, { Path } from 'react-native-svg'

import { AnimatedOverlayModal } from '../../ui/AnimatedOverlayModal'
import { fontSizes } from '../../design/tokens/fontSizes'
import { radius } from '../../design/tokens/radius'
import { shadows } from '../../design/tokens/shadows'
import { spacing } from '../../design/tokens/spacing'
import { ModalCloseDarkIcon } from '../../icons/ModalCloseDarkIcon'
import { Text } from '../../ui/Text'
import { colors } from '../../design/theme/colors'
import { getRichTextEditorCss, richTextHtmlToMarkdown, richTextMarkdownToHtml, richTextSharedFormatting } from '../../ui/richTextFormatting'

type Props = {
  visible: boolean
  title: string
  initialValue: string
  onClose: () => void
  onSave: (value: string) => void | Promise<void>
  saveLabel?: string
}

type ToolbarAction = 'h2' | 'h3' | 'bold' | 'italic' | 'bullet' | 'numbered'
type ToolbarButtonConfig = { key: ToolbarAction; label: string; group: 'text' | 'style' | 'lists' | 'insert' }
type ToolbarState = { h2: boolean; h3: boolean; bold: boolean; italic: boolean; bullet: boolean; numbered: boolean }

const isWeb = Platform.OS === 'web'
const defaultToolbarState: ToolbarState = { h2: false, h3: false, bold: false, italic: false, bullet: false, numbered: false }
const editorClassName = 'rich-text-editor'
const toolbarButtons: readonly ToolbarButtonConfig[] = [
  { key: 'h2', label: 'Kop 2', group: 'text' },
  { key: 'h3', label: 'Kop 3', group: 'text' },
  { key: 'bold', label: 'Vet', group: 'style' },
  { key: 'italic', label: 'Cursief', group: 'style' },
  { key: 'bullet', label: 'Lijst', group: 'lists' },
  { key: 'numbered', label: 'Nummerlijst', group: 'lists' },
] as const

export function RichTextEditorModal({ visible, title, initialValue, onClose, onSave, saveLabel = 'Opslaan' }: Props) {
  const [htmlDraft, setHtmlDraft] = useState('')
  const [plainDraft, setPlainDraft] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [toolbarState, setToolbarState] = useState<ToolbarState>(defaultToolbarState)
  const inputRef = useRef<TextInput | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])
  const editorContentCss = useMemo(() => getRichTextEditorCss(editorClassName), [])

  function syncOrderedListOffsets() {
    if (!isWeb) return
    if (!editorRef.current) return
    const orderedLists = Array.from(editorRef.current.querySelectorAll('ol'))
    orderedLists.forEach((orderedList) => {
      const startNumber = Number(orderedList.getAttribute('start') || '1')
      const safeStartNumber = Number.isFinite(startNumber) && startNumber > 0 ? startNumber : 1
      orderedList.style.setProperty('--rich-text-ordered-start', String(safeStartNumber - 1))
    })
  }

  function isSelectionInsideEditor(selection: Selection | null) {
    if (!selection || !editorRef.current) return false
    if (!selection.anchorNode) return false
    return editorRef.current.contains(selection.anchorNode)
  }

  function saveCurrentSelection() {
    if (!isWeb || typeof window === 'undefined') return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    if (!isSelectionInsideEditor(selection)) return
    savedRangeRef.current = selection.getRangeAt(0).cloneRange()
  }

  function restoreSavedSelection() {
    if (!isWeb || typeof window === 'undefined') return
    if (!savedRangeRef.current) return
    const selection = window.getSelection()
    if (!selection) return
    selection.removeAllRanges()
    selection.addRange(savedRangeRef.current)
  }

  function refreshToolbarState() {
    if (!isWeb || typeof document === 'undefined' || typeof window === 'undefined') return
    const selection = window.getSelection()
    if (!isSelectionInsideEditor(selection)) return
    const formatBlockValue = String(document.queryCommandValue('formatBlock') || '').toLowerCase()
    setToolbarState({
      h2: formatBlockValue.includes('h2'),
      h3: formatBlockValue.includes('h3'),
      bold: Boolean(document.queryCommandState('bold')),
      italic: Boolean(document.queryCommandState('italic')),
      bullet: Boolean(document.queryCommandState('insertUnorderedList')),
      numbered: Boolean(document.queryCommandState('insertOrderedList')),
    })
  }

  function getSelectionLinePrefix(selection: Selection) {
    if (selection.rangeCount === 0) return null
    const range = selection.getRangeAt(0)
    if (!range.collapsed) return null
    const startNode = range.startContainer
    const editorElement = editorRef.current
    if (!editorElement || !editorElement.contains(startNode)) return null

    let currentNode: Node | null = startNode
    let blockElement: HTMLElement | null = null
    while (currentNode && currentNode !== editorElement) {
      if (currentNode instanceof HTMLElement && /^(DIV|P|LI|H2|H3)$/.test(currentNode.tagName)) {
        blockElement = currentNode
        break
      }
      currentNode = currentNode.parentNode
    }
    if (!blockElement) {
      const hasBlockChildren = Array.from(editorElement.childNodes).some(
        (childNode) => childNode instanceof HTMLElement && /^(DIV|P|LI|H2|H3|UL|OL)$/.test(childNode.tagName),
      )
      if (hasBlockChildren) return null
      blockElement = editorElement
    }

    const prefixRange = range.cloneRange()
    prefixRange.setStart(blockElement, 0)
    return { prefixText: prefixRange.toString().replace(/\u00A0/g, ' '), blockElement, range }
  }

  function applyListShortcut(listType: 'bullet' | 'numbered', orderedStartNumber = 1) {
    if (!isWeb || typeof window === 'undefined' || typeof document === 'undefined') return false
    const selection = window.getSelection()
    if (!selection) return false
    const linePrefix = getSelectionLinePrefix(selection)
    if (!linePrefix) return false
    const { blockElement, range } = linePrefix
    const fullText = blockElement.textContent || ''
    const prefixLength = linePrefix.prefixText.length
    const suffixText = fullText.slice(prefixLength)
    blockElement.textContent = linePrefix.prefixText
    const endRange = range.cloneRange()
    endRange.selectNodeContents(blockElement)
    endRange.collapse(false)
    selection.removeAllRanges()
    selection.addRange(endRange)
    if (listType === 'bullet') document.execCommand('insertUnorderedList')
    else document.execCommand('insertOrderedList')
    let listItemElement: HTMLLIElement | null = null
    let currentNode: Node | null = selection.anchorNode
    while (currentNode && currentNode !== editorRef.current) {
      if (currentNode instanceof HTMLLIElement) {
        listItemElement = currentNode
        break
      }
      currentNode = currentNode.parentNode
    }
    if (!listItemElement) return false
    listItemElement.textContent = suffixText
    const itemRange = document.createRange()
    itemRange.selectNodeContents(listItemElement)
    itemRange.collapse(true)
    selection.removeAllRanges()
    selection.addRange(itemRange)
    if (listType === 'numbered' && orderedStartNumber > 1) {
      let currentNode: Node | null = listItemElement.parentNode
      while (currentNode && currentNode !== editorRef.current) {
        if (currentNode instanceof HTMLOListElement) {
          currentNode.setAttribute('start', String(orderedStartNumber))
          break
        }
        if (currentNode instanceof HTMLElement && currentNode.tagName === 'OL') {
          currentNode.setAttribute('start', String(orderedStartNumber))
          break
        }
        currentNode = currentNode.parentNode
      }
    }
    return true
  }

  function handleEditorKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!isWeb || typeof window === 'undefined' || typeof document === 'undefined') return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    if (event.key === ' ') {
      const linePrefix = getSelectionLinePrefix(selection)
      if (!linePrefix) return
      if (linePrefix.prefixText === '-') {
        event.preventDefault()
        if (applyListShortcut('bullet')) {
          const next = editorRef.current?.innerHTML || ''
          setHtmlDraft(next)
          syncOrderedListOffsets()
          saveCurrentSelection()
          refreshToolbarState()
        }
        return
      }
      if (/^\d+\.$/.test(linePrefix.prefixText)) {
        event.preventDefault()
        const orderedStartNumber = Number(linePrefix.prefixText.replace('.', ''))
        if (applyListShortcut('numbered', orderedStartNumber)) {
          const next = editorRef.current?.innerHTML || ''
          setHtmlDraft(next)
          syncOrderedListOffsets()
          saveCurrentSelection()
          refreshToolbarState()
        }
        return
      }
    }

    if (event.key === 'Backspace') {
      const range = selection.getRangeAt(0)
      if (!range.collapsed) return
      let currentNode: Node | null = range.startContainer
      let listItemElement: HTMLLIElement | null = null
      while (currentNode && currentNode !== editorRef.current) {
        if (currentNode instanceof HTMLLIElement) {
          listItemElement = currentNode
          break
        }
        currentNode = currentNode.parentNode
      }
      const linePrefix = getSelectionLinePrefix(selection)
      const isAtLineStart = Boolean(linePrefix && linePrefix.prefixText.length === 0)
      if (listItemElement && isAtLineStart) {
        event.preventDefault()
        const listElement = listItemElement.parentElement
        const parentElement = listElement?.parentElement
        if (listElement && parentElement) {
          const listItems = Array.from(listElement.children).filter((node): node is HTMLLIElement => node instanceof HTMLLIElement)
          const currentIndex = listItems.findIndex((item) => item === listItemElement)
          if (currentIndex >= 0) {
            const beforeItems = listItems.slice(0, currentIndex)
            const afterItems = listItems.slice(currentIndex + 1)
            const listTagName = listElement.tagName === 'OL' ? 'ol' : 'ul'
            const originalStartNumber = Number((listElement as HTMLOListElement).getAttribute?.('start') || '1')
            const safeStartNumber = Number.isFinite(originalStartNumber) && originalStartNumber > 0 ? originalStartNumber : 1
            const listBefore = beforeItems.length > 0 ? document.createElement(listTagName) : null
            const listAfter = afterItems.length > 0 ? document.createElement(listTagName) : null

            if (listBefore) {
              beforeItems.forEach((item) => listBefore.appendChild(item.cloneNode(true)))
              if (listTagName === 'ol' && safeStartNumber > 1) listBefore.setAttribute('start', String(safeStartNumber))
            }

            if (listAfter) {
              afterItems.forEach((item) => listAfter.appendChild(item.cloneNode(true)))
              if (listTagName === 'ol') {
                const nextStart = safeStartNumber + currentIndex + 1
                if (nextStart > 1) listAfter.setAttribute('start', String(nextStart))
              }
            }

            const plainLineElement = document.createElement('div')
            plainLineElement.innerHTML = listItemElement.innerHTML
            plainLineElement.style.marginLeft = '24px'
            plainLineElement.setAttribute('data-pending-outdent', 'true')
            plainLineElement.setAttribute('data-list-mode', listTagName)
            if ((plainLineElement.textContent || '').trim().length === 0) {
              plainLineElement.innerHTML = '<br/>'
            }

            if (listBefore) parentElement.insertBefore(listBefore, listElement)
            parentElement.insertBefore(plainLineElement, listElement)
            if (listAfter) parentElement.insertBefore(listAfter, listElement.nextSibling)
            listElement.remove()

            const nextRange = document.createRange()
            nextRange.selectNodeContents(plainLineElement)
            nextRange.collapse(true)
            selection.removeAllRanges()
            selection.addRange(nextRange)
          }
        }
        const next = editorRef.current?.innerHTML || ''
        setHtmlDraft(next)
        syncOrderedListOffsets()
        saveCurrentSelection()
        refreshToolbarState()
        return
      }

      const blockElement = linePrefix?.blockElement
      if (blockElement instanceof HTMLElement && isAtLineStart && blockElement.getAttribute('data-pending-outdent') === 'true') {
        event.preventDefault()
        blockElement.style.marginLeft = '0px'
        blockElement.removeAttribute('data-pending-outdent')
        blockElement.removeAttribute('data-list-mode')
        const nextRange = document.createRange()
        nextRange.selectNodeContents(blockElement)
        nextRange.collapse(true)
        selection.removeAllRanges()
        selection.addRange(nextRange)
        const next = editorRef.current?.innerHTML || ''
        setHtmlDraft(next)
        syncOrderedListOffsets()
        saveCurrentSelection()
        refreshToolbarState()
        return
      }
    }
  }

  useEffect(() => {
    if (!visible) return
    if (isWeb) {
      const html = richTextMarkdownToHtml(initialValue)
      setHtmlDraft(html)
      if (editorRef.current) editorRef.current.innerHTML = html
      syncOrderedListOffsets()
      return
    }
    setPlainDraft(initialValue)
  }, [initialValue, visible])

  useEffect(() => {
    if (!visible) return
    setShowCloseConfirm(false)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      if (isWeb) {
        editorRef.current?.focus()
        requestAnimationFrame(() => setTimeout(refreshToolbarState, 0))
      } else {
        inputRef.current?.focus()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [visible])

  useEffect(() => {
    if (!isWeb) return
    if (!visible) return
    if (typeof document === 'undefined') return

    const handleSelectionChange = () => {
      saveCurrentSelection()
      refreshToolbarState()
    }
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [visible])

  function runAction(action: ToolbarAction) {
    if (!isWeb || typeof window === 'undefined' || typeof document === 'undefined') return
    editorRef.current?.focus()
    const selection = window.getSelection()
    if (!isSelectionInsideEditor(selection)) restoreSavedSelection()
    const activeSelection = window.getSelection()
    if (!activeSelection || activeSelection.rangeCount === 0 || !isSelectionInsideEditor(activeSelection)) return
    if (action === 'bold') document.execCommand('bold')
    else if (action === 'italic') document.execCommand('italic')
    else if (action === 'bullet') document.execCommand('insertUnorderedList')
    else if (action === 'numbered') document.execCommand('insertOrderedList')
    else if (action === 'h2') document.execCommand('formatBlock', false, 'h2')
    else if (action === 'h3') document.execCommand('formatBlock', false, 'h3')

    const next = editorRef.current?.innerHTML || ''
    setHtmlDraft(next)
    syncOrderedListOffsets()
    saveCurrentSelection()
    refreshToolbarState()
  }

  async function handleSave() {
    if (isSaving) return
    setIsSaving(true)
    try {
      if (isWeb) {
        const html = editorRef.current?.innerHTML || htmlDraft
        await Promise.resolve(onSave(richTextHtmlToMarkdown(html)))
        return
      }
      await Promise.resolve(onSave(plainDraft.trim()))
    } finally {
      setIsSaving(false)
    }
  }

  function normalizeForCompare(value: string) {
    return String(value || '')
      .replace(/\r/g, '')
      .split('\n')
      .map((line) => line.replace(/\s+$/g, ''))
      .join('\n')
      .trim()
  }

  function hasUnsavedChanges() {
    if (isWeb) {
      const html = editorRef.current?.innerHTML || htmlDraft
      const currentMarkdown = normalizeForCompare(richTextHtmlToMarkdown(html))
      const originalMarkdown = normalizeForCompare(initialValue)
      return currentMarkdown !== originalMarkdown
    }
    return normalizeForCompare(plainDraft) !== normalizeForCompare(initialValue)
  }

  function handleRequestClose() {
    if (isSaving) return
    if (!hasUnsavedChanges()) {
      onClose()
      return
    }
    setShowCloseConfirm(true)
  }

  if (!visible) return null

  return (
    <>
      <AnimatedOverlayModal visible={visible} onClose={handleRequestClose} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text isBold style={styles.title}>
            {title}
          </Text>
          <Pressable disabled={isSaving} onPress={handleRequestClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            <ModalCloseDarkIcon size={34} />
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          {toolbarButtons.map((button, index) => {
            const showSeparator = index > 0 && button.group !== toolbarButtons[index - 1].group
            const isActive = toolbarState[button.key as keyof ToolbarState]
            return (
              <React.Fragment key={button.key}>
                {showSeparator ? <View style={styles.toolbarSeparator} /> : null}
                <ToolbarButton label={button.label} action={button.key} isActive={Boolean(isActive)} onPress={() => runAction(button.key)} />
              </React.Fragment>
            )
          })}
        </View>

        <View style={styles.body} {...(isWeb ? ({ onClick: () => editorRef.current?.focus() } as any) : {})}>
          {isWeb ? <style>{editorContentCss}</style> : null}
          {isWeb ? (
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className={editorClassName}
              onInput={(event) => {
                setHtmlDraft((event.target as HTMLDivElement).innerHTML)
                syncOrderedListOffsets()
                saveCurrentSelection()
                refreshToolbarState()
              }}
              onMouseUp={() => {
                saveCurrentSelection()
                refreshToolbarState()
              }}
              onKeyUp={() => {
                saveCurrentSelection()
                refreshToolbarState()
              }}
              onKeyDown={handleEditorKeyDown}
              style={editorWebStyle}
            />
          ) : (
            <TextInput
              ref={inputRef}
              value={plainDraft}
              onChangeText={setPlainDraft}
              multiline
              textAlignVertical="top"
              style={[styles.textInput, inputWebStyle]}
              placeholder="Schrijf of plak hier je tekst..."
              placeholderTextColor={colors.textSecondary}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Pressable
            disabled={isSaving}
            onPress={handleRequestClose}
            style={({ hovered }) => [styles.secondaryButton, isSaving ? styles.buttonDisabled : undefined, hovered ? styles.secondaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.secondaryButtonText}>
              Annuleren
            </Text>
          </Pressable>
          <Pressable
            disabled={isSaving}
            onPress={() => {
              void handleSave()
            }}
            style={({ hovered }) => [styles.primaryButton, isSaving ? styles.buttonDisabled : undefined, hovered ? styles.primaryButtonHovered : undefined]}
          >
            {isSaving ? <LoadingSpinner size="small" color="#FFFFFF" /> : null}
            <Text isBold style={styles.primaryButtonText}>
              {isSaving ? `${saveLabel}...` : saveLabel}
            </Text>
          </Pressable>
        </View>
      </AnimatedOverlayModal>

      <AnimatedOverlayModal
        visible={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        contentContainerStyle={styles.closeWarningContainer}
      >
        <View style={styles.closeWarningHeader}>
          <Text isBold style={styles.closeWarningTitle}>
            Wijzigingen niet opgeslagen
          </Text>
          <Pressable onPress={() => setShowCloseConfirm(false)} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
            <ModalCloseDarkIcon size={34} />
          </Pressable>
        </View>
        <View style={styles.closeWarningBody}>
          <Text style={styles.closeWarningText}>Je hebt wijzigingen gemaakt. Als je nu sluit, gaan die verloren.</Text>
        </View>
        <View style={styles.footer}>
          <Pressable onPress={() => setShowCloseConfirm(false)} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
            <Text isBold style={styles.secondaryButtonText}>
              Blijven bewerken
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setShowCloseConfirm(false)
              onClose()
            }}
            style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}
          >
            <Text isBold style={styles.primaryButtonText}>
              Sluiten zonder opslaan
            </Text>
          </Pressable>
        </View>
      </AnimatedOverlayModal>
    </>
  )
}

function ToolbarButton({ label, action, onPress, isActive = false }: { label: string; action: ToolbarAction; onPress: () => void; isActive?: boolean }) {
  const iconColor = isActive ? '#FFFFFF' : colors.textStrong
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [
        styles.toolbarButton,
        isActive ? styles.toolbarButtonActive : undefined,
        hovered ? (isActive ? styles.toolbarButtonActiveHovered : styles.toolbarButtonHovered) : undefined,
      ]}
      accessibilityLabel={label}
      {...(isWeb ? ({ title: label } as any) : {})}
      {...(isWeb
        ? ({
            onMouseDown: (event: MouseEvent) => {
              event.preventDefault()
            },
          } as any)
        : {})}
    >
      <EditorToolbarIcon action={action} color={iconColor} />
    </Pressable>
  )
}

function EditorToolbarIcon({ action, color }: { action: ToolbarAction; color: string }) {
  const stroke = color
  if (action === 'h2') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M2.25 4.5V13.5M7.5 4.5V13.5M2.25 9H7.5" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M11 6.1L13.6 4.5V13.5M11 13.5H15.2" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'h3') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M2.25 4.5V13.5M7.5 4.5V13.5M2.25 9H7.5" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M11 5.2H14.7L12.6 8.1C13.8 8.2 14.8 9.2 14.8 10.5C14.8 11.9 13.7 13 12.2 13C11.2 13 10.4 12.5 9.9 11.8" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'bold') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M4.88 4.5C4.88 3.4 5.78 2.5 6.88 2.5H12C14.62 2.5 16.75 4.63 16.75 7.25C16.75 9.87 14.62 12 12 12H4.88V4.5Z" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M4.88 12H14.38C17 12 19.13 14.13 19.13 16.75C19.13 19.37 17 21.5 14.38 21.5H6.88C5.78 21.5 4.88 20.6 4.88 19.5V12V12Z" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'italic') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M9.62 3H18.87" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5.12 21H14.37" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M14.25 3L9.75 21" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'bullet') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )
  }

  if (action === 'numbered') {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path
          d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 1 1 1.591 1.59l-1.83 1.83h2.16M2.99 15.745h1.125a1.125 1.125 0 0 1 0 2.25H3.74m0-.002h.375a1.125 1.125 0 0 1 0 2.25H2.99"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    )
  }
  return null
}

const editorWebStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 320,
  border: 'none',
  backgroundColor: 'transparent',
  padding: `${spacing.sm}px`,
  paddingRight: `${spacing.md}px`,
  fontSize: `${richTextSharedFormatting.editorFontSize}px`,
  lineHeight: `${richTextSharedFormatting.editorLineHeight}px`,
  color: colors.text,
  fontFamily: 'Catamaran_400Regular, Catamaran, sans-serif',
  outline: 'none',
  overflowY: 'auto',
  overflowX: 'hidden',
  boxSizing: 'border-box',
  scrollbarGutter: 'stable',
}

const styles = StyleSheet.create({
  container: {
    width: 980,
    maxWidth: '96%',
    maxHeight: '90%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...( { boxShadow: shadows.modal } as any ),
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  toolbar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    ...( { overflowX: 'auto' } as any ),
  },
  toolbarSeparator: {
    width: 1,
    alignSelf: 'stretch',
    marginVertical: 6,
    backgroundColor: colors.border,
  },
  toolbarButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonHovered: {
    backgroundColor: 'rgba(38,52,63,0.06)',
    borderColor: colors.border,
  },
  toolbarButtonActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  toolbarButtonActiveHovered: {
    backgroundColor: 'rgba(199,0,107,0.9)',
    borderColor: 'rgba(199,0,107,0.9)',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...( { flex: 1, minHeight: 360 } as any ),
  },
  textInput: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    lineHeight: 22,
    color: colors.text,
  },
  footer: {
    width: '100%',
    padding: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.surface,
    borderWidth: 0,
    borderColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  secondaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: colors.textStrong,
  },
  primaryButton: {
    height: 48,
    borderRadius: 0,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.selected,
    paddingHorizontal: 24,
    paddingVertical: 0,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  closeWarningContainer: {
    width: 640,
    maxWidth: '90vw',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    ...( { boxShadow: shadows.modal } as any ),
    overflow: 'hidden',
  },
  closeWarningHeader: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeWarningTitle: {
    fontSize: 18,
    lineHeight: 22,
    color: colors.textStrong,
  },
  closeWarningBody: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  closeWarningText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textStrong,
  },
})


