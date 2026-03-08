import { useEffect, useState } from 'react'
import { hasPendingAudioUploads } from './audioChunkStore'
import { startAudioUploadQueue, stopAudioUploadQueue } from './audioUploadQueue'

export function useAudioUploadQueue(isEnabled: boolean) {
  const [hasPendingUploads, setHasPendingUploads] = useState(false)

  useEffect(() => {
    if (!isEnabled) return
    startAudioUploadQueue()
    let isActive = true
    const updateStatus = async () => {
      const pending = await hasPendingAudioUploads()
      if (isActive) setHasPendingUploads(pending)
    }
    const timerId = window.setInterval(updateStatus, 2000)
    void updateStatus()
    return () => {
      isActive = false
      window.clearInterval(timerId)
      stopAudioUploadQueue()
    }
  }, [isEnabled])

  useEffect(() => {
    if (!isEnabled) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingUploads) return
      event.preventDefault()
      event.returnValue = 'De audio wordt nog geüpload. Als je nu sluit kan de opname onvolledig zijn.'
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [hasPendingUploads, isEnabled])

  return { hasPendingUploads }
}
