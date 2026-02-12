import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native'

import { AnimatedOverlayModal } from '../AnimatedOverlayModal'
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
type ToolbarState = { h2: boolean; h3: boolean; bold: boolean; italic: boolean; bullet: boolean; numbered: boolean; quote: boolean }

const isWeb = Platform.OS === 'web'
const defaultToolbarState: ToolbarState = { h2: false, h3: false, bold: false, italic: false, bullet: false, numbered: false, quote: false }

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
        <ToolbarButton label="H2" isActive={toolbarState.h2} onPress={() => runAction('h2')} />
        <ToolbarButton label="H3" isActive={toolbarState.h3} onPress={() => runAction('h3')} />
        <ToolbarButton label="B" isActive={toolbarState.bold} onPress={() => runAction('bold')} />
        <ToolbarButton label="I" isActive={toolbarState.italic} onPress={() => runAction('italic')} />
        <ToolbarButton label="* Lijst" isActive={toolbarState.bullet} onPress={() => runAction('bullet')} />
        <ToolbarButton label="1. Lijst" isActive={toolbarState.numbered} onPress={() => runAction('numbered')} />
        <ToolbarButton label="Citaat" isActive={toolbarState.quote} onPress={() => runAction('quote')} />
        <ToolbarButton label="Lijn" onPress={() => runAction('divider')} />
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

function ToolbarButton({ label, onPress, isActive = false }: { label: string; onPress: () => void; isActive?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ hovered }) => [styles.toolbarButton, isActive ? styles.toolbarButtonActive : undefined, hovered ? styles.toolbarButtonHovered : undefined]}
      {...(isWeb
        ? ({
            onMouseDown: (event: MouseEvent) => {
              event.preventDefault()
            },
          } as any)
        : {})}
    >
      <Text isSemibold style={[styles.toolbarButtonText, isActive ? styles.toolbarButtonTextActive : undefined]}>
        {label}
      </Text>
    </Pressable>
  )
}

const editorWebStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  minHeight: 320,
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  backgroundColor: colors.pageBackground,
  padding: '14px',
  fontSize: '14px',
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
    borderRadius: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolbarButton: {
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  toolbarButtonActive: {
    backgroundColor: colors.selected,
    borderColor: colors.selected,
  },
  toolbarButtonText: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textStrong,
  },
  toolbarButtonTextActive: {
    color: '#FFFFFF',
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    ...( { flex: 1, minHeight: 360 } as any ),
  },
  textInput: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.pageBackground,
    padding: 14,
    fontSize: 14,
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
