package expo.modules.segmentedaudio

import java.util.concurrent.ConcurrentHashMap

object SegmentedRegistry {
  data class Entry(val path: String, val key: ByteArray, val segmentSize: Int, val mimeType: String?)
  private val map = ConcurrentHashMap<String, Entry>()
  fun put(token: String, entry: Entry) {
    map[token] = entry
  }
  fun get(token: String): Entry? = map[token]
  fun remove(token: String) { map.remove(token) }
  fun clear() { map.clear() }
}

