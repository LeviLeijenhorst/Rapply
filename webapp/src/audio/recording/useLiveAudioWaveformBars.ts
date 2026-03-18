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

function buildLogBandRanges(binCount: number, barCount: number) {
  const minBin = 1
  const maxBin = Math.max(minBin + 1, Math.floor(binCount * 0.92))
  const safeBarCount = Math.max(1, barCount)
  const ranges: Array<{ start: number; end: number }> = []

  for (let index = 0; index < safeBarCount; index++) {
    const t0 = index / safeBarCount
    const t1 = (index + 1) / safeBarCount
    const start = Math.floor(minBin * Math.pow(maxBin / minBin, t0))
    const end = Math.ceil(minBin * Math.pow(maxBin / minBin, t1))
    const clampedStart = clamp(start, minBin, maxBin - 1)
    const clampedEnd = clamp(Math.max(clampedStart + 1, end), clampedStart + 1, maxBin)
    ranges.push({ start: clampedStart, end: clampedEnd })
  }

  return ranges
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
    analyser.smoothingTimeConstant = 0.55

    const source = audioContext.createMediaStreamSource(mediaStream)
    source.connect(analyser)

    const binCount = analyser.frequencyBinCount
    const frequencyData = new Uint8Array(binCount)
    const timeDomainData = new Uint8Array(analyser.fftSize)

    const minimumHeight = 8
    const maximumHeight = 180
    const targetFrameMs = 20
    const gain = 1.4
    const bandRanges = buildLogBandRanges(binCount, stableBarCount)

    const tick = () => {
      animationFrameRef.current = window.requestAnimationFrame(tick)
      const now = performance.now()
      if (now - lastUpdateMsRef.current < targetFrameMs) return
      lastUpdateMsRef.current = now

      analyser.getByteFrequencyData(frequencyData)
      analyser.getByteTimeDomainData(timeDomainData)
      let sumSquares = 0
      for (let i = 0; i < timeDomainData.length; i++) {
        const centered = ((timeDomainData[i] ?? 128) - 128) / 128
        sumSquares += centered * centered
      }
      const rms = Math.sqrt(sumSquares / Math.max(1, timeDomainData.length))
      const signalLevel = clamp(rms * 4.2, 0, 1)
      if (signalLevel < 0.01) {
        const silentBars = Array.from({ length: stableBarCount }, () => minimumHeight)
        previousBarsRef.current = silentBars
        setBars(silentBars)
        return
      }

      const nextBars: number[] = []
      const previousBars = previousBarsRef.current
      const centerIndex = (stableBarCount - 1) / 2
      for (let index = 0; index < stableBarCount; index++) {
        const range = bandRanges[index]
        const start = range?.start ?? 0
        const end = range?.end ?? Math.max(1, start + 1)
        let sum = 0
        let peak = 0
        for (let i = start; i < end; i++) sum += frequencyData[i] ?? 0
        for (let i = start; i < end; i++) peak = Math.max(peak, frequencyData[i] ?? 0)
        const average = sum / Math.max(1, end - start)
        const averageNormalized = clamp(average / 255, 0, 1)
        const peakNormalized = clamp(peak / 255, 0, 1)
        const bandEnergy = clamp(averageNormalized * 0.65 + peakNormalized * 0.35, 0, 1)
        const eased = Math.pow(bandEnergy, 1.4)
        const boosted = clamp((eased * gain + signalLevel * 0.08), 0, 1)
        const baseHeight = minimumHeight + boosted * (maximumHeight - minimumHeight)
        const distanceFromCenter = Math.abs(index - centerIndex) / Math.max(1, centerIndex)
        const centerWeight = 0.62 + Math.pow(1 - distanceFromCenter, 1.5) * 0.48
        const weightedHeight = minimumHeight + (baseHeight - minimumHeight) * centerWeight
        const height = clamp(weightedHeight, minimumHeight, maximumHeight)
        const previous = previousBars[index] ?? minimumHeight
        const smoothing = 0.34 + (index % 5) * 0.06
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

