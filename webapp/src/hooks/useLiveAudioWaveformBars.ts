import { useEffect, useMemo, useRef, useState } from 'react'

type Values = {
  mediaStream: MediaStream | null
  barCount: number
  isActive: boolean
}

function createFallbackBars(barCount: number) {
  return Array.from({ length: barCount }, () => 8)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function useLiveAudioWaveformBars({ mediaStream, barCount, isActive }: Values) {
  const [bars, setBars] = useState<number[]>(() => createFallbackBars(barCount))
  const previousBarsRef = useRef<number[]>([])
  const animationFrameRef = useRef<number | null>(null)
  const lastUpdateMsRef = useRef<number>(0)

  const stableBarCount = useMemo(() => Math.max(10, barCount), [barCount])

  useEffect(() => {
    setBars(createFallbackBars(stableBarCount))
    previousBarsRef.current = createFallbackBars(stableBarCount)
  }, [stableBarCount])

  useEffect(() => {
    if (!isActive) return
    if (!mediaStream) return
    if (typeof window === 'undefined') return

    const AudioContextConstructor = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextConstructor) return

    const audioContext: AudioContext = new AudioContextConstructor()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    analyser.smoothingTimeConstant = 0.8

    const source = audioContext.createMediaStreamSource(mediaStream)
    source.connect(analyser)

    const binCount = analyser.frequencyBinCount
    const frequencyData = new Uint8Array(binCount)

    const minimumHeight = 6
    const maximumHeight = 220
    const targetFrameMs = 33
    const smoothing = 0.45
    const gain = 3.6

    const tick = () => {
      animationFrameRef.current = window.requestAnimationFrame(tick)
      const now = performance.now()
      if (now - lastUpdateMsRef.current < targetFrameMs) return
      lastUpdateMsRef.current = now

      analyser.getByteFrequencyData(frequencyData)

      const nextBars: number[] = []
      const previousBars = previousBarsRef.current
      const binsPerBar = Math.max(1, Math.floor(binCount / stableBarCount))
      const centerIndex = (stableBarCount - 1) / 2
      const activeRadius = Math.max(1, Math.floor(stableBarCount * 0.35))

      for (let index = 0; index < stableBarCount; index++) {
        const start = index * binsPerBar
        const end = Math.min(binCount, start + binsPerBar)
        let sum = 0
        for (let i = start; i < end; i++) sum += frequencyData[i] ?? 0
        const average = sum / Math.max(1, end - start)
        const normalized = clamp(average / 255, 0, 1)
        const eased = Math.pow(normalized, 1.4)
        const distanceFromCenter = Math.abs(index - centerIndex)
        const centerWeight = clamp(1 - distanceFromCenter / activeRadius, 0, 1)
        const boosted = clamp(eased * gain, 0, 1)
        const height = minimumHeight + boosted * centerWeight * (maximumHeight - minimumHeight)
        const previous = previousBars[index] ?? minimumHeight
        const smoothed = previous * smoothing + height * (1 - smoothing)
        nextBars.push(smoothed)
      }

      previousBarsRef.current = nextBars
      setBars(nextBars)
    }

    audioContext.resume().catch(() => undefined)
    tick()

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      try {
        source.disconnect()
      } catch {}
      try {
        analyser.disconnect()
      } catch {}
      audioContext.close().catch(() => undefined)
    }
  }, [isActive, mediaStream, stableBarCount])

  return bars
}

