import type { JsonValue } from "../../types/Report"

export type PipelineChatFieldUpdate = {
  fieldId: string
  answer: JsonValue
}

export type PipelineChatResponse = {
  answer: string
  waitingMessage: string
  tool: string
  memoryUpdate: null | { summary: string }
  toneUpdate: null | { tone: string }
  fieldUpdates?: PipelineChatFieldUpdate[]
}

// Enforces a single response shape for all pipeline chat surfaces.
export function createPipelineChatResponse(params: {
  tool: string
  answer: string
  waitingMessage?: string
  memoryUpdate?: null | { summary: string }
  toneUpdate?: null | { tone: string }
  fieldUpdates?: PipelineChatFieldUpdate[]
}): PipelineChatResponse {
  return {
    answer: params.answer,
    waitingMessage: params.waitingMessage ?? "Even nadenken...",
    tool: params.tool,
    memoryUpdate: params.memoryUpdate ?? null,
    toneUpdate: params.toneUpdate ?? null,
    fieldUpdates: params.fieldUpdates ?? [],
  }
}
