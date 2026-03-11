import { callSecureApi } from '../secureApi'
import type { Input } from '../../storage/types'

export async function createInputRemote(input: Input): Promise<void> {
  await callSecureApi('/inputs/create', {
    input: {
      ...input,
      inputType: input.type,
      audioUploadId: input.audioBlobId,
      transcriptText: input.transcript,
      summaryText: input.summary,
    },
  })
}

export async function updateInputRemote(params: {
  id: string
  updatedAtUnixMs: number
  clientId?: string | null
  trajectoryId?: string | null
  type?: Input['type']
  title?: string
  createdAtUnixMs?: number
  audioBlobId?: string | null
  audioDurationSeconds?: number | null
  uploadFileName?: string | null
  transcript?: string | null
  summary?: string | null
  reportDate?: string | null
  transcriptionStatus?: Input['transcriptionStatus']
  transcriptionError?: string | null
}): Promise<void> {
  await callSecureApi('/inputs/update', {
    ...params,
    inputType: params.type,
    audioUploadId: params.audioBlobId,
    transcriptText: params.transcript,
    summaryText: params.summary,
  })
}

export async function deleteInputRemote(id: string): Promise<void> {
  await callSecureApi('/inputs/delete', { id })
}

export const sessionApi = {
  create: createInputRemote,
  update: updateInputRemote,
  delete: deleteInputRemote,
}

