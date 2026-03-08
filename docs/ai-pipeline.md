# AI Pipeline

The pipeline is a first-class architecture layer under `webapp/src/ai`.

## Pipeline Order

1. Input normalization
2. Transcription
3. Snippet extraction
4. Summary generation
5. Snippet approval
6. Client knowledge build
7. Report generation

Entry point: `ai/pipeline/processSessionInput.ts`.

## Input Normalization

Supported input types:

- full audio recording
- spoken recap recording
- written recap
- uploaded audio
- uploaded document (future)

All paths normalize into transcript text.

## Transcription

Modules in `ai/transcription` convert input data to transcript text:

- `normalizeInputToTranscript.ts`
- `transcribeAudioInput.ts`
- `transcribeWrittenInput.ts`
- `transcribeUploadedAudio.ts`
- `transcribeDocumentInput.ts`

## Snippet Extraction

Modules in `ai/snippets` extract and classify snippets from transcript text. For written recap inputs, snippet extraction keeps user wording and only performs logical splitting.

## Summary Generation

Modules in `ai/summaries` generate session summary output and structured summary output from transcript text.

## Snippet Approval

Approval state is managed through `approveSnippet.ts` and `rejectSnippet.ts`. Only approved snippets feed long-term knowledge and reporting.

## Client Knowledge

`buildClientKnowledge.ts` accumulates approved snippets into a reusable knowledge context for chat and reporting.

## Report Generation

Modules in `ai/reports` build report context, select report inputs, and generate report draft text.

## Temporary Audio Rule

Audio lifecycle:

1. temporary upload/store
2. transcription
3. transcript persistence
4. temporary audio delete

Audio is infrastructure data, not persistent product knowledge.
