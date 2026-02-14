import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'
import Svg, { Line, Path } from 'react-native-svg'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
import { fontSizes, radius, shadows, spacing } from '../../foundation/theme/tokens'
import { ModalCloseDarkIcon } from '../icons/ModalCloseDarkIcon'
import { Text } from '../Text'
import { colors } from '../../theme/colors'

type Props = {
  visible: boolean
  title: string
  initialValue: string
  onClose: () => void
  onSave: (value: string) => void
  saveLabel?: string
}

type ToolbarAction = 'h2' | 'h3' | 'bold' | 'italic' | 'bullet' | 'numbered' | 'quote' | 'divider'
type ToolbarButtonConfig = { key: ToolbarAction; label: string; group: 'text' | 'style' | 'lists' | 'insert' }
type ToolbarState = { h2: boolean; h3: boolean; bold: boolean; italic: boolean; bullet: boolean; numbered: boolean; quote: boolean }

const isWeb = Platform.OS === 'web'
const defaultToolbarState: ToolbarState = { h2: false, h3: false, bold: false, italic: false, bullet: false, numbered: false, quote: false }
const toolbarButtons: readonly ToolbarButtonConfig[] = [
  { key: 'h2', label: 'Kop 2', group: 'text' },
  { key: 'h3', label: 'Kop 3', group: 'text' },
  { key: 'bold', label: 'Vet', group: 'style' },
  { key: 'italic', label: 'Cursief', group: 'style' },
  { key: 'bullet', label: 'Lijst', group: 'lists' },
  { key: 'numbered', label: 'Nummerlijst', group: 'lists' },
  { key: 'quote', label: 'Citaat', group: 'insert' },
  { key: 'divider', label: 'Scheidingslijn', group: 'insert' },
] as const

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function markdownInlineToHtml(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
}

function markdownToHtml(markdown: string) {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n')
  const parts: string[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      parts.push('<p><br/></p>')
      index += 1
      continue
    }

    if (trimmed === '---') {
      parts.push('<hr/>')
      index += 1
      continue
    }

    if (/^##\s+/.test(trimmed)) {
      parts.push(`<h2>${markdownInlineToHtml(trimmed.replace(/^##\s+/, ''))}</h2>`)
      index += 1
      continue
    }

    if (/^###\s+/.test(trimmed)) {
      parts.push(`<h3>${markdownInlineToHtml(trimmed.replace(/^###\s+/, ''))}</h3>`)
      index += 1
      continue
    }

    if (/^>\s+/.test(trimmed)) {
      parts.push(`<blockquote>${markdownInlineToHtml(trimmed.replace(/^>\s+/, ''))}</blockquote>`)
      index += 1
      continue
    }

    if (/^-+\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^-+\s+/.test(lines[index].trim())) {
        items.push(`<li>${markdownInlineToHtml(lines[index].trim().replace(/^-+\s+/, ''))}</li>`)
        index += 1
      }
      parts.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(`<li>${markdownInlineToHtml(lines[index].trim().replace(/^\d+\.\s+/, ''))}</li>`)
        index += 1
      }
      parts.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    parts.push(`<p>${markdownInlineToHtml(rawLine)}</p>`)
    index += 1
  }

  return parts.join('')
}

function inlineNodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
  if (!(node instanceof HTMLElement)) return ''

  if (node.tagName === 'STRONG' || node.tagName === 'B') {
    return `**${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('')}**`
  }
  if (node.tagName === 'EM' || node.tagName === 'I') {
    return `*${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('')}*`
  }
  if (node.tagName === 'BR') return '\n'
  return Array.from(node.childNodes).map(inlineNodeToMarkdown).join('')
}

function htmlToMarkdown(html: string): string {
  if (!isWeb || typeof document === 'undefined') return String(html || '').trim()
  const container = document.createElement('div')
  container.innerHTML = html || ''

  const blocks: string[] = []
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim()
      if (text) blocks.push(text)
      return
    }
    if (!(node instanceof HTMLElement)) return

    const tag = node.tagName
    if (tag === 'HR') {
      blocks.push('---')
      return
    }
    if (tag === 'H2') {
      blocks.push(`## ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (tag === 'H3') {
      blocks.push(`### ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (tag === 'BLOCKQUOTE') {
      blocks.push(`> ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (tag === 'UL') {
      Array.from(node.children).forEach((item) => {
        blocks.push(`- ${Array.from(item.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      })
      return
    }
    if (tag === 'OL') {
      Array.from(node.children).forEach((item, idx) => {
        blocks.push(`${idx + 1}. ${Array.from(item.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      })
      return
    }
    if (tag === 'P' || tag === 'DIV') {
      blocks.push(Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim())
      return
    }
    blocks.push(Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim())
  })

  return blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function RichTextEditorModal({ visible, title, initialValue, onClose, onSave, saveLabel = 'Opslaan' }: Props) {
  const [htmlDraft, setHtmlDraft] = useState('')
  const [plainDraft, setPlainDraft] = useState('')
  const [toolbarState, setToolbarState] = useState<ToolbarState>(defaultToolbarState)
  const inputRef = useRef<TextInput | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const inputWebStyle = useMemo(() => ({ outlineStyle: 'none', outlineWidth: 0, outlineColor: 'transparent' } as any), [])

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
    if (!isWeb || typeof document === 'undefined') return
    const formatBlockValue = String(document.queryCommandValue('formatBlock') || '').toLowerCase()
    setToolbarState({
      h2: formatBlockValue.includes('h2'),
      h3: formatBlockValue.includes('h3'),
      bold: Boolean(document.queryCommandState('bold')),
      italic: Boolean(document.queryCommandState('italic')),
      bullet: Boolean(document.queryCommandState('insertUnorderedList')),
      numbered: Boolean(document.queryCommandState('insertOrderedList')),
      quote: formatBlockValue.includes('blockquote'),
    })
  }

  useEffect(() => {
    if (!visible) return
    if (isWeb) {
      const html = markdownToHtml(initialValue)
      setHtmlDraft(html)
      if (editorRef.current) editorRef.current.innerHTML = html
      setToolbarState(defaultToolbarState)
      return
    }
    setPlainDraft(initialValue)
  }, [initialValue, visible])

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      if (isWeb) editorRef.current?.focus()
      else inputRef.current?.focus()
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
    if (!isWeb || typeof document === 'undefined') return
    editorRef.current?.focus()
    restoreSavedSelection()
    if (action === 'bold') document.execCommand('bold')
    else if (action === 'italic') document.execCommand('italic')
    else if (action === 'bullet') document.execCommand('insertUnorderedList')
    else if (action === 'numbered') document.execCommand('insertOrderedList')
    else if (action === 'quote') document.execCommand('formatBlock', false, 'blockquote')
    else if (action === 'h2') document.execCommand('formatBlock', false, 'h2')
    else if (action === 'h3') document.execCommand('formatBlock', false, 'h3')
    else if (action === 'divider') document.execCommand('insertHorizontalRule')

    const next = editorRef.current?.innerHTML || ''
    setHtmlDraft(next)
    saveCurrentSelection()
    refreshToolbarState()
  }

  function handleSave() {
    if (isWeb) {
      const html = editorRef.current?.innerHTML || htmlDraft
      onSave(htmlToMarkdown(html))
      return
    }
    onSave(plainDraft.trim())
  }

  if (!visible) return null

  return (
    <AnimatedOverlayModal visible={visible} onClose={onClose} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text isBold style={styles.title}>
          {title}
        </Text>
        <Pressable onPress={onClose} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
          <ModalCloseDarkIcon size={20} />
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        {toolbarButtons.map((button, index) => {
          const showSeparator = index > 0 && button.group !== toolbarButtons[index - 1].group
          const isActive = button.key === 'divider' ? false : toolbarState[button.key as keyof ToolbarState]
          return (
            <React.Fragment key={button.key}>
              {showSeparator ? <View style={styles.toolbarSeparator} /> : null}
              <ToolbarButton label={button.label} action={button.key} isActive={Boolean(isActive)} onPress={() => runAction(button.key)} />
            </React.Fragment>
          )
        })}
      </View>

      <View style={styles.body}>
        {isWeb ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            onInput={(event) => {
              setHtmlDraft((event.target as HTMLDivElement).innerHTML)
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
        <Pressable onPress={onClose} style={({ hovered }) => [styles.secondaryButton, hovered ? styles.secondaryButtonHovered : undefined]}>
          <Text isBold style={styles.secondaryButtonText}>
            Annuleren
          </Text>
        </Pressable>
        <Pressable onPress={handleSave} style={({ hovered }) => [styles.primaryButton, hovered ? styles.primaryButtonHovered : undefined]}>
          <Text isBold style={styles.primaryButtonText}>
            {saveLabel}
          </Text>
        </Pressable>
      </View>
    </AnimatedOverlayModal>
  )
}

function ToolbarButton({ label, action, onPress, isActive = false }: { label: string; action: ToolbarAction; onPress: () => void; isActive?: boolean }) {
  const iconColor = isActive ? '#FFFFFF' : colors.textStrong
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [styles.toolbarButton, isActive ? styles.toolbarButtonActive : undefined, hovered ? styles.toolbarButtonHovered : undefined]}
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
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M5.2 4.5H9.5C11.1 4.5 12.4 5.6 12.4 7C12.4 8.3 11.3 9.3 9.9 9.3H5.2V4.5Z" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
        <Path d="M5.2 9.3H10.1C11.9 9.3 13.3 10.4 13.3 11.9C13.3 13.4 11.8 14.6 10 14.6H5.2V9.3Z" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'italic') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M10.5 4.5H14.2M3.8 13.5H7.5M10.9 4.5L7.1 13.5" stroke={stroke} strokeWidth={1.8} strokeLinecap="round" />
      </Svg>
    )
  }

  if (action === 'bullet') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M6.4 5.2H14.3M6.4 9H14.3M6.4 12.8H14.3" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M3.8 5.2H3.81M3.8 9H3.81M3.8 12.8H3.81" stroke={stroke} strokeWidth={2.4} strokeLinecap="round" />
      </Svg>
    )
  }

  if (action === 'numbered') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M6.4 5.2H14.3M6.4 9H14.3M6.4 12.8H14.3" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M2.9 4.7H4.1V6.3M2.7 8.1H4.2L2.7 10H4.2M2.6 11.9H4.1C4.6 11.9 5 12.2 5 12.6C5 13 4.6 13.3 4.1 13.3H2.6" stroke={stroke} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    )
  }

  if (action === 'quote') {
    return (
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path d="M6.6 6.2H4.9C4 6.2 3.3 6.9 3.3 7.8V9.7C3.3 10.6 4 11.3 4.9 11.3H6.4" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
        <Path d="M12.8 6.2H11.1C10.2 6.2 9.5 6.9 9.5 7.8V9.7C9.5 10.6 10.2 11.3 11.1 11.3H12.6" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
      </Svg>
    )
  }

  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Line x1={3} y1={9} x2={15} y2={9} stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 4.5V6.5M9 11.5V13.5" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  )
}

const editorWebStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 320,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.pageBackground,
  padding: `${spacing.sm}px`,
  fontSize: `${fontSizes.sm}px`,
  lineHeight: '22px',
  color: colors.text,
  fontFamily: 'Catamaran_400Regular, Catamaran, sans-serif',
  outline: 'none',
  overflow: 'auto',
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
    width: 32,
    height: 32,
    borderRadius: 8,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  secondaryButton: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
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
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.selected,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonHovered: {
    backgroundColor: '#A50058',
  },
  primaryButtonText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
})
