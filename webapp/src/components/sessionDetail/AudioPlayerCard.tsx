import React, { useEffect, useImperativeHandle, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../../theme/colors'
import { useE2ee } from '../../e2ee/E2eeProvider'
import { loadAudioBlobRemote } from '../../services/audioBlobs'

type Props = {
  audioBlobId: string | null
}

export type AudioPlayerHandle = {
  seekToSeconds: (seconds: number) => void
}

export const AudioPlayerCard = React.forwardRef<AudioPlayerHandle, Props>(function AudioPlayerCard({ audioBlobId }, ref) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const e2ee = useE2ee()

  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      seekToSeconds: (seconds: number) => {
        const audio = audioRef.current
        if (!audio) return
        if (!Number.isFinite(seconds)) return
        audio.currentTime = Math.max(0, seconds)
      },
    }),
    [],
  )

  useEffect(() => {
    let isCancelled = false

    async function load() {
      if (!audioBlobId) {
        setAudioUrl(null)
        return
      }

      try {
        const result = await loadAudioBlobRemote(audioBlobId)
        if (isCancelled) return
        if (!result) {
          setAudioUrl(null)
          return
        }
        const decrypted = await e2ee.decryptAudioBlobFromStorage(result.blob)
        if (isCancelled) return
        const nextUrl = URL.createObjectURL(decrypted.audioBlob)
        setAudioUrl(nextUrl)
      } catch (error) {
        console.error('[AudioPlayerCard] Failed to load audio blob', error)
        if (!isCancelled) {
          setAudioUrl(null)
        }
      }
    }

    load()

    return () => {
      isCancelled = true
      setAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
    }
  }, [audioBlobId])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!audioUrl) return
    audio.load()
  }, [audioUrl])

  return (
    <View style={styles.card}>
      {/* Audio player */}
      <audio ref={audioRef} src={audioUrl ?? undefined} preload="metadata" controls style={{ width: '100%' }} />
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
})

