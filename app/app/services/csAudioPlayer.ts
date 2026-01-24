import { NativeModule, requireNativeModule } from "expo"
import { EventEmitter } from "expo-modules-core"

type Events = "player_buffering" | "player_ready" | "player_ended" | "player_error" | "player_position"

type PlayerModule = NativeModule<any> & {
  playerRegisterToken: (token: string, path: string, keyBase64: string, segmentSize: number, mimeType: string | null) => Promise<boolean>
  playerLoad: (token: string) => Promise<boolean>
  playerPlay: () => Promise<boolean>
  playerPause: () => Promise<boolean>
  playerSeekTo: (positionMs: number) => Promise<boolean>
  playerUnload: () => Promise<boolean>
}

const Native = requireNativeModule<PlayerModule>("ExpoSegmentedAudio") as any
type EventMap = Record<Events, any>
const Emitter = new EventEmitter<EventMap>(Native)

export function csAudioAvailable() {
  return !!Native?.isAvailable?.()
}

export async function registerToken(
  token: string,
  path: string,
  wrappedKeyBase64: string | null,
  segmentSize: number,
  cipher: "gcm" | "cbc",
  originalPathForMime?: string,
) {
  const key = wrappedKeyBase64 ?? ""
  const mime = guessMimeTypeFromPath(originalPathForMime || path)
  return await Native.playerRegisterToken(token, path, key, segmentSize, mime)
}

export async function load(token: string) {
  return await Native.playerLoad(token)
}

export async function play() {
  return await Native.playerPlay()
}

export async function pause() {
  return await Native.playerPause()
}

export async function seekTo(positionMs: number) {
  return await Native.playerSeekTo(positionMs)
}

export async function unload() {
  return await Native.playerUnload()
}

export function addListener(event: Events, cb: (payload?: any) => void) {
  const sub = Emitter.addListener(event, cb as any)
  return { remove: () => sub.remove() }
}

function guessMimeTypeFromPath(p: string): string | null {
  const m = p.toLowerCase()
  if (m.endsWith(".m4a") || m.endsWith(".mp4") || m.endsWith(".aac")) return "audio/mp4"
  if (m.endsWith(".mp3")) return "audio/mpeg"
  if (m.endsWith(".wav")) return "audio/wav"
  if (m.endsWith(".ogg")) return "audio/ogg"
  if (m.endsWith(".webm")) return "audio/webm"
  return null
}

