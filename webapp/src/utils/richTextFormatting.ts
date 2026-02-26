export type RichTextInlineSegment = {
  text: string
  isBold: boolean
  isItalic: boolean
}

export type RichTextLine =
  | { kind: 'empty' }
  | { kind: 'divider' }
  | { kind: 'quote'; text: string; segments: RichTextInlineSegment[] }
  | { kind: 'headingTwo'; text: string; segments: RichTextInlineSegment[] }
  | { kind: 'headingThree'; text: string; segments: RichTextInlineSegment[] }
  | { kind: 'bullet'; text: string; segments: RichTextInlineSegment[] }
  | { kind: 'numbered'; number: number; text: string; segments: RichTextInlineSegment[] }
  | { kind: 'paragraph'; text: string; segments: RichTextInlineSegment[] }

export const richTextSharedFormatting = {
  headingTwoFontSize: 20,
  headingThreeFontSize: 16,
  headingLineHeight: 24,
  headingFontWeight: '700' as const,
  paragraphFontSize: 14,
  paragraphLineHeight: 20,
  listFontSize: 17,
  listLineHeight: 24,
  listMarkerFontWeight: '700' as const,
  quoteFontSize: 14,
  quoteLineHeight: 20,
  editorFontSize: 17,
  editorLineHeight: 24,
  editorListIndent: 28,
  editorNumberMarkerWidth: 26,
  editorNumberMarkerGap: 8,
} as const

export function getRichTextEditorCss(className: string) {
  const selector = `.${className}`
  const listIndent = `${richTextSharedFormatting.editorListIndent}px`
  return [
    `${selector} p, ${selector} div {`,
    `  margin: 0;`,
    `  font-size: ${richTextSharedFormatting.editorFontSize}px;`,
    `  line-height: ${richTextSharedFormatting.editorLineHeight}px;`,
    `}`,
    `${selector} h2, ${selector} h3 {`,
      `  margin: 0;`,
      `  line-height: ${richTextSharedFormatting.headingLineHeight}px;`,
      `  font-weight: ${richTextSharedFormatting.headingFontWeight};`,
    `}`,
    `${selector} h2 {`,
    `  font-size: ${richTextSharedFormatting.headingTwoFontSize}px;`,
    `}`,
    `${selector} h3 {`,
    `  font-size: ${richTextSharedFormatting.headingThreeFontSize}px;`,
    `}`,
    `${selector} blockquote {`,
    `  margin: 0;`,
    `  padding-left: 10px;`,
    `  border-left: 2px solid #D9D4D2;`,
    `  font-size: ${richTextSharedFormatting.quoteFontSize}px;`,
    `  line-height: ${richTextSharedFormatting.quoteLineHeight}px;`,
    `}`,
    `${selector} ul, ${selector} ol {`,
    `  margin: 0;`,
    `  padding-left: ${listIndent};`,
    `}`,
    `${selector} ul > li, ${selector} ol > li {`,
    `  margin: 0;`,
    `  font-size: ${richTextSharedFormatting.listFontSize}px;`,
    `  line-height: ${richTextSharedFormatting.listLineHeight}px;`,
    `}`,
    `${selector} ul > li::marker {`,
      `  font-weight: ${richTextSharedFormatting.listMarkerFontWeight};`,
    `}`,
    `${selector} ol > li::marker {`,
      `  font-weight: ${richTextSharedFormatting.listMarkerFontWeight};`,
    `}`,
  ].join('\n')
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
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

export function parseRichTextInlineSegments(text: string): RichTextInlineSegment[] {
  const source = String(text || '')
  const segments: RichTextInlineSegment[] = []
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let cursor = 0
  let match: RegExpExecArray | null = null

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > cursor) {
      segments.push({
        text: source.slice(cursor, match.index),
        isBold: false,
        isItalic: false,
      })
    }
    const token = match[0]
    const isBold = token.startsWith('**')
    const content = isBold ? token.slice(2, -2) : token.slice(1, -1)
    segments.push({
      text: content,
      isBold,
      isItalic: !isBold,
    })
    cursor = match.index + token.length
  }

  if (cursor < source.length) {
    segments.push({
      text: source.slice(cursor),
      isBold: false,
      isItalic: false,
    })
  }

  if (segments.length === 0) {
    return [
      {
        text: source.replace(/\*\*/g, '').replace(/\*/g, ''),
        isBold: false,
        isItalic: false,
      },
    ]
  }

  return segments
}

export function parseRichTextMarkdown(markdown: string): RichTextLine[] {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n')
  return lines.map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return { kind: 'empty' }
    if (trimmed === '---') return { kind: 'divider' }
    if (/^>\s+/.test(trimmed)) {
      const text = trimmed.replace(/^>\s+/, '').trim()
      return { kind: 'quote', text, segments: parseRichTextInlineSegments(text) }
    }
    if (/^##\s+/.test(trimmed)) {
      const text = trimmed.replace(/^##\s+/, '').trim()
      return { kind: 'headingTwo', text, segments: parseRichTextInlineSegments(text) }
    }
    if (/^###\s+/.test(trimmed)) {
      const text = trimmed.replace(/^###\s+/, '').trim()
      return { kind: 'headingThree', text, segments: parseRichTextInlineSegments(text) }
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s+/, '').trim()
      return { kind: 'bullet', text, segments: parseRichTextInlineSegments(text) }
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^(\d+)\.\s+/)
      const number = Number(match?.[1] || 1)
      const text = trimmed.replace(/^\d+\.\s+/, '').trim()
      return { kind: 'numbered', number: Number.isFinite(number) ? number : 1, text, segments: parseRichTextInlineSegments(text) }
    }
    return { kind: 'paragraph', text: line, segments: parseRichTextInlineSegments(line) }
  })
}

export function richTextInlineMarkdownToHtml(text: string) {
  const segments = parseRichTextInlineSegments(text)
  return segments
    .map((segment) => {
      const safe = escapeHtml(segment.text)
      if (segment.isBold) return `<strong>${safe}</strong>`
      if (segment.isItalic) return `<em>${safe}</em>`
      return safe
    })
    .join('')
}

export function richTextMarkdownToHtml(markdown: string) {
  const lines = parseRichTextMarkdown(markdown)
  const html: string[] = []
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    if (line.kind === 'empty') {
      html.push('<p><br/></p>')
      index += 1
      continue
    }
    if (line.kind === 'divider') {
      html.push('<hr/>')
      index += 1
      continue
    }
    if (line.kind === 'quote') {
      html.push(`<blockquote>${richTextInlineMarkdownToHtml(line.text)}</blockquote>`)
      index += 1
      continue
    }
    if (line.kind === 'headingTwo') {
      html.push(`<h2>${richTextInlineMarkdownToHtml(line.text)}</h2>`)
      index += 1
      continue
    }
    if (line.kind === 'headingThree') {
      html.push(`<h3>${richTextInlineMarkdownToHtml(line.text)}</h3>`)
      index += 1
      continue
    }
    if (line.kind === 'bullet') {
      const items: string[] = []
      while (index < lines.length) {
        const currentLine = lines[index]
        if (currentLine.kind !== 'bullet') break
        items.push(`<li>${richTextInlineMarkdownToHtml(currentLine.text)}</li>`)
        index += 1
      }
      html.push(`<ul>${items.join('')}</ul>`)
      continue
    }
    if (line.kind === 'numbered') {
      const items: string[] = []
      const start = line.number
      while (index < lines.length) {
        const currentLine = lines[index]
        if (currentLine.kind !== 'numbered') break
        items.push(`<li>${richTextInlineMarkdownToHtml(currentLine.text)}</li>`)
        index += 1
      }
      html.push(`<ol${start > 1 ? ` start="${start}"` : ''}>${items.join('')}</ol>`)
      continue
    }
    html.push(`<p>${richTextInlineMarkdownToHtml(line.text)}</p>`)
    index += 1
  }
  return html.join('')
}

export function richTextHtmlToMarkdown(html: string) {
  if (typeof document === 'undefined') return String(html || '').trim()
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
    if (node.tagName === 'HR') {
      blocks.push('---')
      return
    }
    if (node.tagName === 'H2') {
      blocks.push(`## ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (node.tagName === 'H3') {
      blocks.push(`### ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (node.tagName === 'BLOCKQUOTE') {
      blocks.push(`> ${Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      return
    }
    if (node.tagName === 'UL') {
      Array.from(node.children).forEach((child) => {
        blocks.push(`- ${Array.from(child.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      })
      return
    }
    if (node.tagName === 'OL') {
      const start = Number(node.getAttribute('start') || '1')
      const safeStart = Number.isFinite(start) && start > 0 ? start : 1
      Array.from(node.children).forEach((child, index) => {
        blocks.push(`${safeStart + index}. ${Array.from(child.childNodes).map(inlineNodeToMarkdown).join('').trim()}`)
      })
      return
    }
    if (node.tagName === 'P' || node.tagName === 'DIV') {
      blocks.push(Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim())
      return
    }
    blocks.push(Array.from(node.childNodes).map(inlineNodeToMarkdown).join('').trim())
  })

  return blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
