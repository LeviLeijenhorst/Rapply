import {
  clearPendingPreviewAudio,
  getPendingPreviewAudio,
  retainPendingPreviewAudio,
  setPendingPreviewAudio,
} from '../pendingPreviewStore'

export const temporaryAudioStore = {
  set: setPendingPreviewAudio,
  get: getPendingPreviewAudio,
  retain: retainPendingPreviewAudio,
  clear: clearPendingPreviewAudio,
}
