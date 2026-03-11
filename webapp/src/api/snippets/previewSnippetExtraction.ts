import { extractSessionSnippets } from './extractSessionSnippets'

type PreviewSnippet = {
  field: string
  text: string
}

type PreviewChunk = {
  chunkIndex: number
  promptUsed: string
  rawModelResponse: string
  parsedSnippets: PreviewSnippet[]
}

export async function previewSnippetExtraction(params: {
  sourceInputType?: string
  transcript: string
}): Promise<{
  snippets: PreviewSnippet[]
  debugChunks: PreviewChunk[]
}> {
  const snippets = (await extractSessionSnippets({
    sessionId: 'ai-lab-session',
    clientId: 'ai-lab-client',
    trajectoryId: 'ai-lab-trajectory',
    inputType: params.sourceInputType,
    transcript: params.transcript,
    sessionDate: Date.now(),
  }))
    .map((snippet) => ({
      field: String(snippet.field || '').trim(),
      text: String(snippet.text || '').trim(),
    }))
    .filter((snippet) => Boolean(snippet.text))

  return {
    snippets,
    debugChunks: [
      {
        chunkIndex: 0,
        promptUsed: '',
        rawModelResponse: JSON.stringify(snippets, null, 2),
        parsedSnippets: snippets,
      },
    ],
  }
}
