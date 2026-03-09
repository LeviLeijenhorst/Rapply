import { readFileSync } from 'node:fs'
import { buildSessionSummaryPrompt } from './buildSessionSummaryPrompt'
import { resolveSummaryTemplateSections } from './resolveSummaryTemplateSections'
import type { SummaryTemplate } from './summaryTemplate'

type CliOptions = {
  apiBaseUrl: string
  authToken: string
  responseMode: 'markdown' | 'structured_item_summary'
  templateFilePath: string | null
}

function getArgValue(flag: string): string | null {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) return null
  return value
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function parseOptions(): CliOptions {
  const apiBaseUrl =
    getArgValue('--api-url') ||
    process.env.SUMMARY_API_BASE_URL ||
    process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ||
    'http://127.0.0.1:8787'
  const authToken = getArgValue('--token') || process.env.SUMMARY_AUTH_TOKEN || process.env.ACCESS_TOKEN || ''
  const responseMode = hasFlag('--structured') ? 'structured_item_summary' : 'markdown'
  const templateFilePath = getArgValue('--template-file')
  return {
    apiBaseUrl,
    authToken,
    responseMode,
    templateFilePath,
  }
}

function readTemplateFromFile(path: string | null): SummaryTemplate | undefined {
  if (!path) return undefined
  const raw = readFileSync(path, 'utf8')
  const parsed = JSON.parse(raw) as SummaryTemplate
  if (!parsed || typeof parsed.name !== 'string' || !Array.isArray(parsed.sections)) {
    throw new Error('Invalid template JSON. Expected: { "name": string, "sections": [{ "title": string, "description": string }] }')
  }
  return resolveSummaryTemplateSections(parsed)
}

async function readTranscriptFromStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    console.log('Paste transcript, then end input with Ctrl+Z and Enter (Windows) or Ctrl+D (Mac/Linux).')
  }

  let transcript = ''
  for await (const chunk of process.stdin) {
    transcript += String(chunk)
  }
  return transcript.trim()
}

async function main(): Promise<void> {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log('Usage:')
    console.log('  tsx webapp/src/ai/summaries/testSummaryCli.ts [--api-url <url>] [--token <jwt>] [--structured] [--template-file <path>]')
    console.log('')
    console.log('Token can also be set via SUMMARY_AUTH_TOKEN.')
    return
  }

  const options = parseOptions()
  if (!options.authToken) {
    throw new Error('Missing auth token. Set SUMMARY_AUTH_TOKEN or pass --token <token>.')
  }

  const transcript = await readTranscriptFromStdin()
  if (!transcript) {
    throw new Error('Transcript is empty.')
  }

  const template = readTemplateFromFile(options.templateFilePath)
  const prompt = buildSessionSummaryPrompt({ transcript, template })
  const response = await fetch(`${options.apiBaseUrl}/summary/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.authToken}`,
    },
    body: JSON.stringify({
      transcript: prompt,
      responseMode: options.responseMode,
    }),
  })

  const bodyText = await response.text()
  if (!response.ok) {
    throw new Error(`Summary request failed (${response.status}): ${bodyText}`)
  }

  const body = JSON.parse(bodyText) as { summary?: string }
  const summary = String(body?.summary || '').trim()
  if (!summary) {
    throw new Error('No summary returned.')
  }

  console.log('\n=== SUMMARY ===\n')
  console.log(summary)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\nError: ${message}`)
  process.exit(1)
})
