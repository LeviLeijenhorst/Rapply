import { callSecureApi } from '../secureApi'
import type { Session } from '../../storage/types'

export async function createSessionRemote(session: Session): Promise<void> {
  await callSecureApi('/sessions/create', {
    session: {
      ...session,
      clientId: session.coacheeId,
      inputType: session.kind,
      audioUploadId: session.audioBlobId,
      transcriptText: session.transcript,
      summaryText: session.summary,
    },
  })
}

export async function updateSessionRemote(params: {
  id: string
  updatedAtUnixMs: number
  coacheeId?: string | null
  trajectoryId?: string | null
  kind?: Session['kind']
  title?: string
  createdAtUnixMs?: number
  audioBlobId?: string | null
  audioDurationSeconds?: number | null
  uploadFileName?: string | null
  transcript?: string | null
  summary?: string | null
  summaryStructured?: Session['summaryStructured']
  reportDate?: string | null
  wvpWeekNumber?: string | null
  reportFirstSickDay?: string | null
  transcriptionStatus?: Session['transcriptionStatus']
  transcriptionError?: string | null
}): Promise<void> {
  await callSecureApi('/sessions/update', {
    ...params,
    clientId: params.coacheeId,
    inputType: params.kind,
    audioUploadId: params.audioBlobId,
    transcriptText: params.transcript,
    summaryText: params.summary,
  })
}

export async function deleteSessionRemote(id: string): Promise<void> {
  await callSecureApi('/sessions/delete', { id })
}

export const sessionApi = {
  create: createSessionRemote,
  update: updateSessionRemote,
  delete: deleteSessionRemote,
}
