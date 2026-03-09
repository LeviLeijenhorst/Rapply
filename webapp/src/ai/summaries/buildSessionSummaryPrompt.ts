import type { SummaryTemplate } from './summaryTemplate'

// Keep this in sync with prompts/sessionSummaryPrompt.md until the app loads prompt files directly.
const summaryInstructions = [
  'You are Coachscribe session summarization AI.',
  'Write a concise, factual summary using only the provided transcript context.',
  'Do not invent actions, diagnoses, dates, or people.',
  'If a report template is provided, structure the answer around those sections.',
  'Keep wording professional and concrete.',
].join('\n')

function formatTemplate(template: SummaryTemplate | undefined): string {
  if (!template) return 'No template sections provided.'
  if (template.sections.length === 0) {
    return `Template name: ${template.name}`
  }

  return [
    `Template name: ${template.name}`,
    'Template sections:',
    ...template.sections.map((section, index) => `${index + 1}. ${section.title}\n${section.description}`),
  ].join('\n')
}

export function buildSessionSummaryPrompt(params: {
  transcript: string
  template?: SummaryTemplate
}): string {
  return [
    '[SESSION_SUMMARY_PROMPT]',
    summaryInstructions,
    '',
    formatTemplate(params.template),
    '',
    'Transcript:',
    String(params.transcript || '').trim(),
    '[/SESSION_SUMMARY_PROMPT]',
  ]
    .filter(Boolean)
    .join('\n')
    .trim()
}
