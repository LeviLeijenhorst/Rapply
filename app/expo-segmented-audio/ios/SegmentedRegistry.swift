import Foundation

final class SegmentedRegistry {
  struct Entry {
    let path: String
    let keyData: Data
    let segmentSize: Int
    let mimeType: String?
  }

  static let shared = SegmentedRegistry()

  private let queue = DispatchQueue(label: "ExpoSegmentedAudio.SegmentedRegistry", attributes: .concurrent)
  private var map: [String: Entry] = [:]

  func put(token: String, entry: Entry) {
    queue.async(flags: .barrier) { [weak self] in
      self?.map[token] = entry
    }
  }

  func get(token: String) -> Entry? {
    queue.sync { map[token] }
  }

  func remove(token: String) {
    queue.async(flags: .barrier) { [weak self] in
      self?.map.removeValue(forKey: token)
    }
  }

  func clear() {
    queue.async(flags: .barrier) { [weak self] in
      self?.map.removeAll()
    }
  }
}


