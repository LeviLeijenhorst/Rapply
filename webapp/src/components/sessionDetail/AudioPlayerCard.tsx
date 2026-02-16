import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native'
import { colors } from '../../theme/colors'
import { useE2ee } from '../../e2ee/E2eeProvider'
import { loadAudioBlobRemote } from '../../services/audioBlobs'
import { downloadAudioStream } from '../../audio/downloadAudioStream'
import { Text } from '../Text'
import { AudioBackwardIcon } from '../icons/AudioBackwardIcon'
import { AudioForwardIcon } from '../icons/AudioForwardIcon'
import { PlaySmallIcon } from '../icons/PlaySmallIcon'
import { PauseIcon } from '../icons/PauseIcon'
import { AudioEncryptedIcon } from '../icons/AudioEncryptedIcon'
import { AudioDecryptedIcon } from '../icons/AudioDecryptedIcon'

type Props = {
  audioBlobId: string | null
  audioDurationSeconds: number | null
  audioUrlOverride?: string | null
  isEncrypting?: boolean
  onCurrentSecondsChange?: (seconds: number) => void
}

export type AudioPlayerHandle = {
  seekToSeconds: (seconds: number) => void
}

export const AudioPlayerCard = React.forwardRef<AudioPlayerHandle, Props>(function AudioPlayerCard(
  { audioBlobId, audioDurationSeconds, audioUrlOverride = null, isEncrypting = false, onCurrentSecondsChange },
  ref,
) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const e2ee = useE2ee()

  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [currentSeconds, setCurrentSeconds] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState(audioDurationSeconds ?? 0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [hasAudioError, setHasAudioError] = useState(false)
  const [isDraggingSeek, setIsDraggingSeek] = useState(false)
  const [dragPreviewSeconds, setDragPreviewSeconds] = useState<number | null>(null)
  const [waveformWidth, setWaveformWidth] = useState(0)
  const pendingSeekSecondsRef = useRef<number | null>(null)
  const pendingResumeAfterSeekRef = useRef(false)
  const seekResumePlaybackRef = useRef<boolean | null>(null)
  const previousAudioUrlOverrideRef = useRef<string | null>(null)

  function formatTimeLabel(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00'
    const totalSeconds = Math.floor(seconds)
    const minutes = Math.floor(totalSeconds / 60)
    const remainingSeconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  async function resumePlaybackIfNeeded() {
    const audio = audioRef.current
    if (!audio) return
    if (!pendingResumeAfterSeekRef.current) return
    if (!audio.paused) {
      pendingResumeAfterSeekRef.current = false
      return
    }
    try {
      await audio.play()
      pendingResumeAfterSeekRef.current = false
    } catch {
      // Retry on next canplay event.
    }
  }

  function seekToSecondsInternal(seconds: number, preservePlayState: boolean) {
    const audio = audioRef.current
    const activeAudioSource = audioUrlOverride ?? audioUrl
    if (!Number.isFinite(seconds)) return
    const target = Math.max(0, Math.min(durationSeconds || Number.MAX_SAFE_INTEGER, seconds))
    setCurrentSeconds(target)
    onCurrentSecondsChange?.(target)
    if (!audio || !activeAudioSource) {
      pendingSeekSecondsRef.current = target
      return
    }
    const shouldResume = preservePlayState && !audio.paused
    pendingResumeAfterSeekRef.current = shouldResume
    if (shouldResume) {
      audio.pause()
    }
    audio.currentTime = target
    void resumePlaybackIfNeeded()
  }

  function skipBySeconds(deltaSeconds: number) {
    const audio = audioRef.current
    if (!audio) return
    const base = Number.isFinite(audio.currentTime) ? audio.currentTime : currentSeconds
    const target = base + deltaSeconds
    const shouldResume = seekResumePlaybackRef.current ?? !audio.paused
    seekToSecondsInternal(target, shouldResume)
  }

  useImperativeHandle(
    ref,
    () => ({
      seekToSeconds: (seconds: number) => {
        seekToSecondsInternal(seconds, false)
      },
    }),
    [audioUrl, durationSeconds],
  )

  useEffect(() => {
    if (audioUrlOverride) {
      const isNewOverrideSource = previousAudioUrlOverrideRef.current !== audioUrlOverride
      previousAudioUrlOverrideRef.current = audioUrlOverride
      setIsBuffering(false)
      setHasAudioError(false)
      setIsLoadingAudio(false)
      if (isNewOverrideSource) {
        setIsAudioReady(false)
        setCurrentSeconds(0)
        onCurrentSecondsChange?.(0)
      }
      return
    }
    previousAudioUrlOverrideRef.current = null
    let isCancelled = false

    async function load() {
      setIsBuffering(false)
      setIsAudioReady(false)
      setHasAudioError(false)
      if (!audioBlobId) {
        setAudioUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return null
        })
        setCurrentSeconds(0)
        onCurrentSecondsChange?.(0)
        setIsLoadingAudio(false)
        return
      }

      let nextUrl: string | null = null
      try {
        setIsLoadingAudio(true)
        const result = await loadAudioBlobRemote(audioBlobId)
        if (!result) {
          throw new Error('Audio blob not found')
        }
        const decrypted = await e2ee.decryptAudioBlobFromStorage(result.blob)
        nextUrl = URL.createObjectURL(decrypted.audioBlob)
      } catch (error) {
        console.warn('[AudioPlayerCard] Blob load failed, trying stream fallback', error)
        try {
          const decrypted = await downloadAudioStream({
            audioStreamId: audioBlobId,
            decryptChunk: (encryptedChunk) => e2ee.decryptAudioChunkFromStorage({ encryptedChunk }),
          })
          nextUrl = URL.createObjectURL(decrypted.audioBlob)
        } catch (fallbackError) {
          console.error('[AudioPlayerCard] Failed to load audio via blob and stream', fallbackError)
        }
      } finally {
        if (isCancelled) {
          if (nextUrl) URL.revokeObjectURL(nextUrl)
          return
        }
        setAudioUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return nextUrl
        })
        setCurrentSeconds(0)
        onCurrentSecondsChange?.(0)
        setIsLoadingAudio(false)
      }
    }

    void load()

    return () => {
      isCancelled = true
      setAudioUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return null
      })
    }
  }, [audioBlobId, e2ee, audioUrlOverride, onCurrentSecondsChange])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const source = audioUrlOverride ?? audioUrl
    if (!source) return
    audio.load()
  }, [audioUrl, audioUrlOverride])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoadedMetadata = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0
      setDurationSeconds(duration)
      setIsAudioReady(true)
      setIsLoadingAudio(false)
      if (pendingSeekSecondsRef.current !== null) {
        audio.currentTime = pendingSeekSecondsRef.current
        pendingSeekSecondsRef.current = null
      }
    }
    const onTimeUpdate = () => {
      const nextSeconds = Number.isFinite(audio.currentTime) ? audio.currentTime : 0
      setCurrentSeconds(nextSeconds)
      onCurrentSecondsChange?.(nextSeconds)
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onWaiting = () => setIsBuffering(true)
    const onSeeking = () => setIsBuffering(true)
    const onSeeked = () => {
      setIsBuffering(false)
      void resumePlaybackIfNeeded()
    }
    const onCanPlay = () => {
      setIsBuffering(false)
      setIsAudioReady(true)
      setIsLoadingAudio(false)
      void resumePlaybackIfNeeded()
    }
    const onCanPlayThrough = () => {
      setIsBuffering(false)
      setIsAudioReady(true)
      setIsLoadingAudio(false)
    }
    const onStalled = () => setIsBuffering(false)
    const onAbort = () => setIsBuffering(false)
    const onError = () => {
      setIsBuffering(false)
      setIsPlaying(false)
      setIsAudioReady(false)
      setHasAudioError(true)
      setIsLoadingAudio(false)
      pendingResumeAfterSeekRef.current = false
    }
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('seeking', onSeeking)
    audio.addEventListener('seeked', onSeeked)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('canplaythrough', onCanPlayThrough)
    audio.addEventListener('stalled', onStalled)
    audio.addEventListener('abort', onAbort)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('seeking', onSeeking)
      audio.removeEventListener('seeked', onSeeked)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('canplaythrough', onCanPlayThrough)
      audio.removeEventListener('stalled', onStalled)
      audio.removeEventListener('abort', onAbort)
      audio.removeEventListener('error', onError)
    }
  }, [audioUrl, audioUrlOverride, onCurrentSecondsChange])

  useEffect(() => {
    if (!Number.isFinite(audioDurationSeconds || null) || audioDurationSeconds === null) return
    setDurationSeconds(Math.max(0, audioDurationSeconds))
  }, [audioDurationSeconds])

  const waveformBarWidth = 2
  const waveformBarGap = 2
  const waveformHorizontalPadding = 2
  const waveformBarStep = waveformBarWidth + waveformBarGap
  const waveformBarCount = useMemo(() => {
    if (waveformWidth <= 0) return 120
    const availableWidth = Math.max(0, waveformWidth - waveformHorizontalPadding * 2)
    return Math.max(12, Math.floor((availableWidth + waveformBarGap) / waveformBarStep))
  }, [waveformWidth, waveformHorizontalPadding, waveformBarGap, waveformBarStep])
  const waveformHeights = useMemo(() => {
    return Array.from({ length: waveformBarCount }, (_, index) => {
      const noise = Math.abs(Math.sin(index * 0.61) * 0.7 + Math.sin(index * 0.17 + 1.3) * 0.3)
      return 10 + Math.round(noise * 22)
    })
  }, [waveformBarCount])
  const canSeek = durationSeconds > 0
  const displayedSeconds = dragPreviewSeconds ?? currentSeconds
  const playedRatio = canSeek ? Math.max(0, Math.min(1, displayedSeconds / durationSeconds)) : 0
  const timeLabel = `${formatTimeLabel(currentSeconds)}/${formatTimeLabel(durationSeconds)}`
  const effectiveAudioUrl = audioUrlOverride ?? audioUrl
  const hasPlayableAudio = Boolean(effectiveAudioUrl)
  const showPlaySpinner = isLoadingAudio || isBuffering || (!audioUrlOverride && !hasAudioError && hasPlayableAudio && !isAudioReady)
  const showEncryptingStatus = isEncrypting
  const showDecryptingStatus = !isEncrypting && isLoadingAudio && !audioUrlOverride
  const showStatus = showEncryptingStatus || showDecryptingStatus

  return (
    <View style={styles.card}>
      <audio ref={audioRef} src={effectiveAudioUrl ?? undefined} preload="auto" />
      <View style={styles.controls}>
        <View
          style={styles.waveformWrap}
          onLayout={(event) => {
            const nextWidth = Math.round(event.nativeEvent.layout.width || 0)
            if (nextWidth !== waveformWidth) {
              setWaveformWidth(nextWidth)
            }
          }}
        >
          <View style={styles.waveformBars} pointerEvents="none">
            {waveformHeights.map((height, index) => {
              const ratio = (index + 1) / waveformBarCount
              const isPlayed = ratio <= playedRatio
              return <View key={index} style={[styles.waveformBar, { width: waveformBarWidth, height, backgroundColor: isPlayed ? colors.selected : '#C9C5C2' }]} />
            })}
          </View>
          <input
            type="range"
            min={0}
            max={canSeek ? durationSeconds : 0}
            step={0.1}
            value={canSeek ? Math.min(displayedSeconds, durationSeconds) : 0}
            onMouseDown={() => {
              const audio = audioRef.current
              if (!audio) return
              setIsDraggingSeek(true)
              setDragPreviewSeconds(Number.isFinite(audio.currentTime) ? audio.currentTime : currentSeconds)
              seekResumePlaybackRef.current = !audio.paused
            }}
            onTouchStart={() => {
              const audio = audioRef.current
              if (!audio) return
              setIsDraggingSeek(true)
              setDragPreviewSeconds(Number.isFinite(audio.currentTime) ? audio.currentTime : currentSeconds)
              seekResumePlaybackRef.current = !audio.paused
            }}
            onMouseUp={(event) => {
              const nextValue = Number(event.currentTarget.value || 0)
              const shouldResume = seekResumePlaybackRef.current ?? !!isPlaying
              setIsDraggingSeek(false)
              setDragPreviewSeconds(null)
              seekToSecondsInternal(nextValue, shouldResume)
              seekResumePlaybackRef.current = null
            }}
            onTouchEnd={(event) => {
              const nextValue = Number((event.currentTarget as HTMLInputElement).value || 0)
              const shouldResume = seekResumePlaybackRef.current ?? !!isPlaying
              setIsDraggingSeek(false)
              setDragPreviewSeconds(null)
              seekToSecondsInternal(nextValue, shouldResume)
              seekResumePlaybackRef.current = null
            }}
            onBlur={() => {
              setIsDraggingSeek(false)
              setDragPreviewSeconds(null)
              seekResumePlaybackRef.current = null
            }}
            onInput={(event) => {
              const nextValue = Number((event.currentTarget as HTMLInputElement).value || 0)
              setDragPreviewSeconds(nextValue)
            }}
            onChange={(event) => {
              const nextValue = Number(event.currentTarget.value || 0)
              if (isDraggingSeek) {
                setDragPreviewSeconds(nextValue)
                return
              }
              const shouldResume = seekResumePlaybackRef.current ?? !!isPlaying
              seekToSecondsInternal(nextValue, shouldResume)
            }}
            style={styles.waveformRangeInput as any}
          />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.timeSlot}>
            <Text style={styles.timeLabel}>{timeLabel}</Text>
          </View>
          <View style={styles.actionRow}>
            <Pressable onPress={() => skipBySeconds(-10)} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
              <AudioBackwardIcon />
            </Pressable>

            <Pressable
              onPress={() => {
                const audio = audioRef.current
                if (!audio || showPlaySpinner || !hasPlayableAudio) return
                if (audio.paused) {
                  void audio.play().catch(() => undefined)
                } else {
                  pendingResumeAfterSeekRef.current = false
                  audio.pause()
                }
              }}
              disabled={showPlaySpinner || !hasPlayableAudio}
              style={({ hovered }) => [styles.playButton, hovered ? styles.playButtonHovered : undefined]}
            >
              {showPlaySpinner ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : isPlaying ? (
                <PauseIcon size={20} color="#FFFFFF" />
              ) : (
                <View style={styles.playIconWrap}>
                  <PlaySmallIcon size={20} color="#FFFFFF" />
                </View>
              )}
            </Pressable>

            <Pressable onPress={() => skipBySeconds(10)} style={({ hovered }) => [styles.iconButton, hovered ? styles.iconButtonHovered : undefined]}>
              <AudioForwardIcon />
            </Pressable>
          </View>
          <View style={styles.bufferSlot}>
            <Text style={styles.bufferHint}>{''}</Text>
          </View>
        </View>
        <View style={styles.statusRow}>
          {showStatus ? (
            <>
              {showEncryptingStatus ? <AudioEncryptedIcon size={14} color="#171717" /> : <AudioDecryptedIcon size={14} color="#171717" />}
              <Text style={styles.statusText}>{showEncryptingStatus ? 'Audio wordt versleuteld' : 'Audio wordt ontsleuteld'}</Text>
            </>
          ) : null}
        </View>
      </View>
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
  controls: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  waveformWrap: {
    width: '100%',
    height: 60,
    borderRadius: 10,
    position: 'relative',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  waveformBars: {
    width: '100%',
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 2,
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  waveformBar: {
    minWidth: 1,
    flexShrink: 0,
    borderRadius: 999,
  },
  waveformRangeInput: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  bottomRow: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  timeSlot: {
    width: 170,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  bufferSlot: {
    width: 120,
    marginLeft: 'auto',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  actionRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonHovered: {
    backgroundColor: colors.hoverBackground,
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonHovered: {
    opacity: 0.9,
  },
  playIconWrap: {
    marginLeft: 1,
  },
  timeLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    lineHeight: 14,
    minWidth: 80,
    letterSpacing: 0.2,
  },
  bufferHint: {
    color: colors.textSecondary,
    minWidth: 90,
    textAlign: 'right',
  },
  statusRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 16,
    marginTop: -2,
  },
  statusText: {
    fontSize: 10,
    lineHeight: 14,
    color: '#171717',
  },
})

