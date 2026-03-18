import { Directory, Paths, File } from "expo-file-system"
import { requireNativeModule } from "expo"
import { getOrCreateLocalEncryptionKey } from "./encryptionKey"
import { logger } from "@/utils/logger"

const ExpoSegmentedAudioNative = requireNativeModule<any>("ExpoSegmentedAudio") as any

const pathCache = new Map<string, string>()
const inflight = new Set<string>()

export function makeAudioKey(coacheeName: string, conversationId: string) {
  const coacheeId = coacheeName.trim().toLowerCase().replace(/\s+/g, "_")
  return `${coacheeId}/${conversationId}`
}

export function isDecryptedAudioCacheUri(uri: string | null | undefined) {
  if (typeof uri !== "string") return false
  if (!uri) return false
  return uri.includes("/Rapply/decrypted/")
}

export async function deleteDecryptedAudioCacheFile(uri: string | null | undefined) {
  if (!isDecryptedAudioCacheUri(uri)) return
  try {
    const file = new File(uri as string)
    if (file.exists) {
      file.delete()
    }
  } catch {}
}

export function isSegmentedAudioDecryptionAvailable() {
  return !!ExpoSegmentedAudioNative?.decryptSegmentedToFile
}

function extensionFromName(name: string) {
  const lower = name.toLowerCase()
  let base = name
  if (lower.endsWith(".csg1")) {
    base = name.slice(0, -5)
  } else if (lower.endsWith(".enc")) {
    base = name.slice(0, -4)
  }
  const i = base.lastIndexOf(".")
  return i >= 0 ? base.slice(i + 1).toLowerCase() : "m4a"
}

function extensionFromUri(uri: string) {
  const m = uri.match(/\.([a-z0-9]+)(?:\?|#|$)/i)
  return m ? m[1].toLowerCase() : "m4a"
}

async function fileExists(uri: string) {
  try {
    const f = new File(uri)
    return f.exists
  } catch {
    return false
  }
}

export async function ensureDecryptedFile(
  coacheeName: string,
  conversationId: string,
  listFiles: (dir: string) => Promise<string[]>,
  _readEncryptedFile: (dir: string, name: string) => Promise<string>,
) {
  logger.debug("ensureDecryptedFile:start")
  const key = makeAudioKey(coacheeName, conversationId)
  if (pathCache.has(key)) {
    const cached = pathCache.get(key)!
    if (await fileExists(cached)) return cached
    pathCache.delete(key)
  }
  // Prefer an existing cached decrypted file if present
  try {
    const nm0 = coacheeName.trim()
    const coacheeId0 = nm0 ? nm0.toLowerCase().replace(/\s+/g, "_") : "loose_recordings"
    const dirObj0 = new Directory(Paths.cache, `Rapply/decrypted/${coacheeId0}`)
    if (dirObj0.exists) {
      const tryExts0 = ["m4a", "mp3", "wav", "webm", "ogg"]
      for (const ext of tryExts0) {
        const fileObj0 = new File(dirObj0, `${conversationId}.${ext}`)
        const target0 = fileObj0.uri
        if (await fileExists(target0)) {
          logger.debug("ensureDecryptedFile:cache_preference_hit")
          pathCache.set(key, target0)
          return target0
        }
      }
    }
  } catch {}
  if (inflight.has(key)) {
    logger.debug("ensureDecryptedFile:wait_inflight")
    while (inflight.has(key)) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50))
    }
    const cached = pathCache.get(key)
    if (cached) return cached
  }
  inflight.add(key)
  try {
    const nm = coacheeName.trim()
    const coacheeId = nm ? nm.toLowerCase().replace(/\s+/g, "_") : "loose_recordings"
    const baseDirectory = `Rapply/coachees/${coacheeId}/${conversationId}`
    logger.debug("ensureDecryptedFile:base_directory", { coacheeId, conversationId, baseDirectory })
    const files = await listFiles(baseDirectory)
    logger.debug("ensureDecryptedFile:list_files", {
      filesCount: Array.isArray(files) ? files.length : 0,
      sample: Array.isArray(files) ? files.slice(0, 20) : [],
    })
    const audioFileName = files.find((n) => {
      const lower = n.toLowerCase()
      if (!lower.startsWith("audio.")) return false
      if (lower === "audio.cache.txt") return false
      if (lower === "audio.source.txt") return false
      if (lower === "audio.txt") return false
      if (lower.endsWith(".txt")) return false
      return true
    })
    logger.debug("ensureDecryptedFile:audio_candidate", { found: !!audioFileName })
    if (!audioFileName) {
      const dirObj = new Directory(Paths.cache, `Rapply/decrypted/${coacheeId}`)
      if (!dirObj.exists) {
        dirObj.create({ intermediates: true })
      }
      const tryExts = ["m4a", "mp3", "wav", "webm", "ogg"]
      for (const ext of tryExts) {
        const fileObj = new File(dirObj, `${conversationId}.${ext}`)
        const target = fileObj.uri
        if (await fileExists(target)) {
          logger.debug("ensureDecryptedFile:fallback_cache_hit")
          pathCache.set(key, target)
          return target
        }
      }
      logger.debug("ensureDecryptedFile:no_audio_file")
      return undefined
    }
    const ext = extensionFromName(audioFileName)
    const dirObj = new Directory(Paths.cache, `Rapply/decrypted/${coacheeId}`)
    if (!dirObj.exists) {
      dirObj.create({ intermediates: true })
    }
    const fileObj = new File(dirObj, `${conversationId}.${ext}`)
    const target = fileObj.uri
    if (await fileExists(target)) {
      logger.debug("ensureDecryptedFile:exists")
      pathCache.set(key, target)
      return target
    }
    const encryptedDir = new Directory(Paths.document, baseDirectory)
    const encryptedFile = new File(encryptedDir, audioFileName)
    logger.debug("ensureDecryptedFile:encrypted_file", {
      audioFileName,
      encryptedUri: encryptedFile.uri,
      exists: encryptedFile.exists,
      size: encryptedFile.exists ? encryptedFile.size : 0,
    })
    const toFsPath = (u: string) => (u.startsWith("file://") ? u.slice(7) : u)
    if (!ExpoSegmentedAudioNative?.decryptFile) {
      logger.warn("ensureDecryptedFile:native_missing_decryptFile")
      throw new Error("native audio decrypt not available")
    }
    const keyBase64 = await getOrCreateLocalEncryptionKey()
    const isSegmented = audioFileName.toLowerCase().endsWith(".csg1")
    if (isSegmented && !ExpoSegmentedAudioNative?.decryptSegmentedToFile) {
      logger.warn("ensureDecryptedFile:native_missing_decryptSegmentedToFile")
      throw new Error("native segmented audio decrypt not available")
    }
    logger.debug("ensureDecryptedFile:decrypt:start", { isSegmented, outputUri: target })
    const ok = isSegmented
      ? await ExpoSegmentedAudioNative.decryptSegmentedToFile(toFsPath(encryptedFile.uri), toFsPath(target), keyBase64)
      : await ExpoSegmentedAudioNative.decryptFile(toFsPath(encryptedFile.uri), toFsPath(target), keyBase64)
    logger.debug("ensureDecryptedFile:decrypt:result", { ok })
    if (!ok) throw new Error("native audio decrypt failed")
    try {
      const out = new File(target)
      logger.debug("ensureDecryptedFile:output_file", { exists: out.exists, size: out.exists ? out.size : 0 })
    } catch {}
    logger.debug("ensureDecryptedFile:wrote")
    pathCache.set(key, target)
    return target
  } catch (e: any) {
    logger.warn("ensureDecryptedFile:error", { message: String(e?.message || e) })
    try {
      const nm = coacheeName.trim()
      const coacheeId = nm ? nm.toLowerCase().replace(/\s+/g, "_") : "loose_recordings"
      const dirObj = new Directory(Paths.cache, `Rapply/decrypted/${coacheeId}`)
      if (!dirObj.exists) {
        dirObj.create({ intermediates: true })
      }
      const tryExts = ["m4a", "mp3", "wav", "webm", "ogg"]
      for (const ext of tryExts) {
        const fileObj = new File(dirObj, `${conversationId}.${ext}`)
        const target = fileObj.uri
        if (await fileExists(target)) {
          logger.debug("ensureDecryptedFile:fallback_cache_hit")
          pathCache.set(key, target)
          return target
        }
      }
    } catch {}
    return undefined
  } finally {
    inflight.delete(key)
    logger.debug("ensureDecryptedFile:done")
  }
}
