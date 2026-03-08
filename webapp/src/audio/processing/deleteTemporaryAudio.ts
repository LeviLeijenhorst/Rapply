import { clearPendingPreviewAudio } from '../pendingPreviewStore'

export async function deleteTemporaryAudio(sessionId: string) {
  await clearPendingPreviewAudio(sessionId)
}
