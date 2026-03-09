import React, { useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'

import { Text } from '../ui/Text'
import { fontSizes } from '../design/tokens/fontSizes'
import { radius } from '../design/tokens/radius'
import { colors } from '../design/theme/colors'

type Props = {
  value: string
  onPreviewChange: (nextHexColor: string) => void
  onCommit: (nextHexColor: string) => void
}

type HsvColor = {
  h: number
  s: number
  v: number
}

const DEFAULT_HEX_COLOR = '#BE0165'
const SATURATION_WIDTH = 336
const SATURATION_HEIGHT = 168
const HUE_TRACK_HEIGHT = 18
const SATURATION_THUMB_SIZE = 16
const SATURATION_THUMB_EXPANDED_HEIGHT = 24
const SATURATION_THUMB_EXPANDED_WIDTH = 24
const HUE_THUMB_SIZE = 18
const HUE_THUMB_EXPANDED_HEIGHT = 26
const HUE_THUMB_EXPANDED_WIDTH = 26
const DOUBLE_TAP_WINDOW_MS = 360
const COMMIT_DEBOUNCE_MS = 260

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeHexColor(value: string) {
  const trimmed = String(value || '').trim().toUpperCase()
  if (!/^#[0-9A-F]{6}$/.test(trimmed)) return DEFAULT_HEX_COLOR
  return trimmed
}

function sanitizeHexInput(value: string) {
  return String(value || '')
    .toUpperCase()
    .replace('#', '')
    .replace(/[^0-9A-F]/g, '')
    .slice(0, 6)
}

function normalizeTypedHexInput(value: string) {
  const cleaned = sanitizeHexInput(value)
  if (cleaned.length === 6) return `#${cleaned}`
  return null
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0').toUpperCase()
  return `#${toHex(clamp(Math.round(r), 0, 255))}${toHex(clamp(Math.round(g), 0, 255))}${toHex(clamp(Math.round(b), 0, 255))}`
}

function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex).slice(1)
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  }
}

function hsvToRgb({ h, s, v }: HsvColor) {
  const safeHue = ((h % 360) + 360) % 360
  const safeS = clamp(s, 0, 1)
  const safeV = clamp(v, 0, 1)
  const chroma = safeV * safeS
  const huePrime = safeHue / 60
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1))

  let r1 = 0
  let g1 = 0
  let b1 = 0

  if (huePrime >= 0 && huePrime < 1) {
    r1 = chroma
    g1 = x
  } else if (huePrime < 2) {
    r1 = x
    g1 = chroma
  } else if (huePrime < 3) {
    g1 = chroma
    b1 = x
  } else if (huePrime < 4) {
    g1 = x
    b1 = chroma
  } else if (huePrime < 5) {
    r1 = x
    b1 = chroma
  } else {
    r1 = chroma
    b1 = x
  }

  const m = safeV - chroma
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
  }
}

function rgbToHsv(r: number, g: number, b: number): HsvColor {
  const red = clamp(r, 0, 255) / 255
  const green = clamp(g, 0, 255) / 255
  const blue = clamp(b, 0, 255) / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  if (hue < 0) hue += 360

  return {
    h: hue,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hexToHsv(hex: string): HsvColor {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHsv(r, g, b)
}

function hsvToHex(hsv: HsvColor) {
  const { r, g, b } = hsvToRgb(hsv)
  return rgbToHex(r, g, b)
}

function getClientPoint(event: any): { x: number; y: number } | null {
  if (typeof event?.clientX === 'number' && typeof event?.clientY === 'number') {
    return { x: event.clientX, y: event.clientY }
  }
  const touch = event?.touches?.[0] ?? event?.changedTouches?.[0]
  if (touch && typeof touch.clientX === 'number' && typeof touch.clientY === 'number') {
    return { x: touch.clientX, y: touch.clientY }
  }
  const native = event?.nativeEvent
  if (native && typeof native.clientX === 'number' && typeof native.clientY === 'number') {
    return { x: native.clientX, y: native.clientY }
  }
  return null
}

export function PracticeColorPicker({ value, onPreviewChange, onCommit }: Props) {
  const normalizedValue = normalizeHexColor(value)
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(normalizedValue))
  const [typedHexValue, setTypedHexValue] = useState(normalizedValue.slice(1))
  const [isSaturationThumbExpanded, setIsSaturationThumbExpanded] = useState(false)
  const [isHueThumbExpanded, setIsHueThumbExpanded] = useState(false)
  const saturationAreaRef = useRef<View | null>(null)
  const hueAreaRef = useRef<View | null>(null)
  const dragModeRef = useRef<'saturation' | 'hue' | null>(null)
  const pointerIsDownRef = useRef(false)
  const rafHandleRef = useRef<number | null>(null)
  const pendingHsvRef = useRef<HsvColor | null>(null)
  const latestHexRef = useRef(normalizedValue)
  const lastCommittedHexRef = useRef(normalizedValue)
  const lastSaturationTapAtRef = useRef(0)
  const lastHueTapAtRef = useRef(0)
  const commitDebounceHandleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setHsv(hexToHsv(normalizedValue))
    setTypedHexValue(normalizedValue.slice(1))
    latestHexRef.current = normalizedValue
  }, [normalizedValue])

  useEffect(() => {
    return () => {
      if (rafHandleRef.current !== null && typeof window !== 'undefined') {
        window.cancelAnimationFrame(rafHandleRef.current)
      }
      if (commitDebounceHandleRef.current) {
        clearTimeout(commitDebounceHandleRef.current)
        commitDebounceHandleRef.current = null
      }
    }
  }, [])

  const saturationBaseColor = useMemo(() => hsvToHex({ h: hsv.h, s: 1, v: 1 }), [hsv.h])
  const currentHex = useMemo(() => hsvToHex(hsv), [hsv])

  function applyHsv(nextHsv: HsvColor) {
    const nextHex = hsvToHex(nextHsv)
    pendingHsvRef.current = nextHsv
    latestHexRef.current = nextHex
    if (rafHandleRef.current !== null || typeof window === 'undefined') {
      if (typeof window === 'undefined') {
        setHsv(nextHsv)
        onPreviewChange(nextHex)
        setTypedHexValue(nextHex.slice(1))
      }
      return
    }
    rafHandleRef.current = window.requestAnimationFrame(() => {
      rafHandleRef.current = null
      const nextFrameHsv = pendingHsvRef.current
      if (!nextFrameHsv) return
      const nextFrameHex = hsvToHex(nextFrameHsv)
      setHsv(nextFrameHsv)
      onPreviewChange(nextFrameHex)
      setTypedHexValue(nextFrameHex.slice(1))
    })
  }

  function commitCurrentColor() {
    const commitHex = pendingHsvRef.current ? hsvToHex(pendingHsvRef.current) : latestHexRef.current
    latestHexRef.current = commitHex
    pendingHsvRef.current = null
    if (commitHex === lastCommittedHexRef.current) return
    lastCommittedHexRef.current = commitHex
    onCommit(commitHex)
  }

  function updateSaturationFromPoint(clientX: number, clientY: number) {
    const rect = (saturationAreaRef.current as any)?.getBoundingClientRect?.()
    if (!rect) return
    const x = clamp((clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((clientY - rect.top) / rect.height, 0, 1)
    applyHsv({ h: hsv.h, s: x, v: 1 - y })
  }

  function updateHueFromPoint(clientX: number) {
    const rect = (hueAreaRef.current as any)?.getBoundingClientRect?.()
    if (!rect) return
    const x = clamp((clientX - rect.left) / rect.width, 0, 1)
    applyHsv({ h: x * 360, s: hsv.s, v: hsv.v })
  }

  function onSaturationStart(event: any) {
    const point = getClientPoint(event)
    if (!point) return
    pointerIsDownRef.current = true
    const now = Date.now()
    if (now - lastSaturationTapAtRef.current <= DOUBLE_TAP_WINDOW_MS) {
      setIsSaturationThumbExpanded(true)
    }
    lastSaturationTapAtRef.current = now
    dragModeRef.current = 'saturation'
    updateSaturationFromPoint(point.x, point.y)
  }

  function onHueStart(event: any) {
    const point = getClientPoint(event)
    if (!point) return
    pointerIsDownRef.current = true
    const now = Date.now()
    if (now - lastHueTapAtRef.current <= DOUBLE_TAP_WINDOW_MS) {
      setIsHueThumbExpanded(true)
    }
    lastHueTapAtRef.current = now
    dragModeRef.current = 'hue'
    updateHueFromPoint(point.x)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onMove = (event: PointerEvent) => {
      const mode = dragModeRef.current
      if (!mode) return
      const point = getClientPoint(event)
      if (!point) return
      if (mode === 'saturation') {
        event.preventDefault()
        updateSaturationFromPoint(point.x, point.y)
        return
      }
      event.preventDefault()
      updateHueFromPoint(point.x)
    }

    const onUp = () => {
      if (!dragModeRef.current) return
      pointerIsDownRef.current = false
      dragModeRef.current = null
      setIsSaturationThumbExpanded(false)
      setIsHueThumbExpanded(false)
      commitCurrentColor()
    }

    window.addEventListener('pointermove', onMove, true)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    return () => {
      window.removeEventListener('pointermove', onMove, true)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
    }
  }, [currentHex])

  useEffect(() => {
    if (pointerIsDownRef.current) return
    if (commitDebounceHandleRef.current) {
      clearTimeout(commitDebounceHandleRef.current)
      commitDebounceHandleRef.current = null
    }
    commitDebounceHandleRef.current = setTimeout(() => {
      commitDebounceHandleRef.current = null
      commitCurrentColor()
    }, COMMIT_DEBOUNCE_MS)
    return () => {
      if (commitDebounceHandleRef.current) {
        clearTimeout(commitDebounceHandleRef.current)
        commitDebounceHandleRef.current = null
      }
    }
  }, [currentHex])

  const saturationThumbLeft = `${hsv.s * 100}%`
  const saturationThumbTop = `${(1 - hsv.v) * 100}%`
  const hueThumbLeft = `${(hsv.h / 360) * 100}%`

  const saturationThumbHeight = isSaturationThumbExpanded ? SATURATION_THUMB_EXPANDED_HEIGHT : SATURATION_THUMB_SIZE
  const saturationThumbWidth = isSaturationThumbExpanded ? SATURATION_THUMB_EXPANDED_WIDTH : SATURATION_THUMB_SIZE
  const hueThumbHeight = isHueThumbExpanded ? HUE_THUMB_EXPANDED_HEIGHT : HUE_THUMB_SIZE
  const hueThumbWidth = isHueThumbExpanded ? HUE_THUMB_EXPANDED_WIDTH : HUE_THUMB_SIZE

  return (
    <View style={styles.container}>
      <View
        style={styles.saturationFrame}
        {...({
          onPointerDown: onSaturationStart,
        } as any)}
      >
        <View ref={saturationAreaRef} style={[styles.saturationArea, { backgroundColor: saturationBaseColor }]}>
          <View style={styles.saturationWhiteOverlay} />
          <View style={styles.saturationBlackOverlay} />
        </View>
        <View
          style={[
            styles.saturationThumb,
            {
              left: saturationThumbLeft,
              top: saturationThumbTop,
              width: saturationThumbWidth,
              height: saturationThumbHeight,
              transform: [{ translateX: -saturationThumbWidth / 2 }, { translateY: -saturationThumbHeight / 2 }],
              borderColor: hsv.v < 0.35 ? '#FFFFFF' : '#1D0A00',
              backgroundColor: currentHex,
            },
          ]}
        />
      </View>

      <View
        ref={hueAreaRef}
        style={styles.hueArea}
        {...({
          onPointerDown: onHueStart,
        } as any)}
      >
        <View
          style={[
            styles.hueThumb,
            {
              left: hueThumbLeft,
              width: hueThumbWidth,
              height: hueThumbHeight,
              transform: [{ translateX: -hueThumbWidth / 2 }, { translateY: -hueThumbHeight / 2 }],
              backgroundColor: currentHex,
            },
          ]}
        />
      </View>

      <View style={styles.currentColorRow}>
        <View style={[styles.previewSwatch, { backgroundColor: currentHex }]} />
        <View style={styles.currentColorInputWrap}>
          <TextInput
            value={typedHexValue}
            onChangeText={(nextValue) => {
              const sanitized = sanitizeHexInput(nextValue)
              setTypedHexValue(sanitized)
              const normalizedTypedColor = normalizeTypedHexInput(sanitized)
              if (!normalizedTypedColor) return
              const nextHsv = hexToHsv(normalizedTypedColor)
              setHsv(nextHsv)
              latestHexRef.current = normalizedTypedColor
              onPreviewChange(normalizedTypedColor)
            }}
            onBlur={() => {
              const normalizedTypedColor = normalizeTypedHexInput(typedHexValue)
              const normalizedToApply = normalizeHexColor(normalizedTypedColor || currentHex)
              setTypedHexValue(normalizedToApply.slice(1))
              setHsv(hexToHsv(normalizedToApply))
              latestHexRef.current = normalizedToApply
              onPreviewChange(normalizedToApply)
              onCommit(normalizedToApply)
            }}
            onSubmitEditing={() => {
              const normalizedTypedColor = normalizeTypedHexInput(typedHexValue)
              const normalizedToApply = normalizeHexColor(normalizedTypedColor || currentHex)
              setTypedHexValue(normalizedToApply.slice(1))
              setHsv(hexToHsv(normalizedToApply))
              latestHexRef.current = normalizedToApply
              onPreviewChange(normalizedToApply)
              onCommit(normalizedToApply)
            }}
            autoCorrect={false}
            autoCapitalize="characters"
            placeholder="BE0165"
            placeholderTextColor={colors.textSecondary}
            style={styles.currentColorInput}
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: SATURATION_WIDTH,
    maxWidth: '100%',
    gap: 10,
    ...( { overflow: 'visible' } as any ),
  },
  previewSwatch: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saturationArea: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    ...( { cursor: 'crosshair', position: 'relative' } as any ),
  },
  saturationFrame: {
    width: SATURATION_WIDTH,
    height: SATURATION_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...( { position: 'relative', overflow: 'hidden', cursor: 'crosshair' } as any ),
  },
  saturationWhiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    ...( { backgroundImage: 'linear-gradient(to right, #FFFFFF, rgba(255,255,255,0))' } as any ),
  },
  saturationBlackOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    ...( { backgroundImage: 'linear-gradient(to top, #000000, rgba(0,0,0,0))' } as any ),
  },
  saturationThumb: {
    ...( { position: 'absolute', transitionProperty: 'height, width, transform', transitionDuration: '150ms', transitionTimingFunction: 'ease-out' } as any ),
    borderRadius: 999,
    borderWidth: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  hueArea: {
    width: SATURATION_WIDTH,
    height: HUE_TRACK_HEIGHT,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    ...( { position: 'relative', overflow: 'visible', cursor: 'ew-resize', backgroundImage: 'linear-gradient(90deg, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)' } as any ),
  },
  hueThumb: {
    ...( { position: 'absolute', top: '50%', transitionProperty: 'height, width, transform', transitionDuration: '150ms', transitionTimingFunction: 'ease-out' } as any ),
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  currentColorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentColorInputWrap: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  currentColorInput: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: fontSizes.sm,
    lineHeight: 20,
    color: colors.textStrong,
    ...( { outlineStyle: 'none', outlineWidth: 0 } as any ),
  },
})


