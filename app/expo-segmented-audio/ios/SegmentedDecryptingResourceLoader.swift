import Foundation
import AVFoundation
import CryptoKit
import UniformTypeIdentifiers

final class SegmentedDecryptingResourceLoader: NSObject, AVAssetResourceLoaderDelegate {
  private let token: String
  private let entry: SegmentedRegistry.Entry
  private let index: SegmentedFileIndex
  private let key: SymmetricKey
  private let queue = DispatchQueue(label: "ExpoSegmentedAudio.ResourceLoader")

  private var cachedSegmentOrder: [Int] = []
  private var cachedSegments: [Int: Data] = [:]
  private let maximumCachedSegments = 12

  init(token: String, entry: SegmentedRegistry.Entry) throws {
    self.token = token
    self.entry = entry
    let url = URL(fileURLWithPath: entry.path)
    self.index = try SegmentedFileIndex(url: url)
    self.key = SymmetricKey(data: entry.keyData)
  }

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, shouldWaitForLoadingOfRequestedResource loadingRequest: AVAssetResourceLoadingRequest) -> Bool {
    queue.async {
      do {
        try self.handleLoadingRequest(loadingRequest)
      } catch {
        loadingRequest.finishLoading(with: error)
      }
    }
    return true
  }

  func resourceLoader(_ resourceLoader: AVAssetResourceLoader, didCancel loadingRequest: AVAssetResourceLoadingRequest) {}

  private func handleLoadingRequest(_ loadingRequest: AVAssetResourceLoadingRequest) throws {
    if let info = loadingRequest.contentInformationRequest {
      info.isByteRangeAccessSupported = true
      info.contentLength = index.plaintextLength
      if let mimeType = entry.mimeType, let type = UTType(mimeType: mimeType) {
        info.contentType = type.identifier
      } else {
        info.contentType = UTType.audio.identifier
      }
    }

    guard let dataRequest = loadingRequest.dataRequest else {
      loadingRequest.finishLoading()
      return
    }

    let startOffset = Int64(dataRequest.currentOffset != 0 ? dataRequest.currentOffset : dataRequest.requestedOffset)
    let requestedLength = dataRequest.requestedLength
    if requestedLength <= 0 {
      loadingRequest.finishLoading()
      return
    }

    let endOffsetExclusive = min(index.plaintextLength, startOffset + Int64(requestedLength))
    if startOffset >= endOffsetExclusive {
      loadingRequest.finishLoading()
      return
    }

    var position = startOffset
    while position < endOffsetExclusive {
      let segmentSize = Int64(index.segmentSize)
      let segmentIndex = Int(position / segmentSize)
      let withinSegment = Int(position % segmentSize)
      let segmentPlain = try getSegmentPlaintext(segmentIndex: segmentIndex)
      let take = min(segmentPlain.count - withinSegment, Int(endOffsetExclusive - position))
      if take <= 0 { break }
      let chunk = segmentPlain.subdata(in: withinSegment..<(withinSegment + take))
      dataRequest.respond(with: chunk)
      position += Int64(take)
    }

    loadingRequest.finishLoading()
  }

  private func getSegmentPlaintext(segmentIndex: Int) throws -> Data {
    if let cached = cachedSegments[segmentIndex] {
      touchCache(segmentIndex: segmentIndex)
      return cached
    }

    let fileUrl = URL(fileURLWithPath: entry.path)
    let handle = try FileHandle(forReadingFrom: fileUrl)
    defer { try? handle.close() }

    let segHeaderOffset = index.segmentHeaderOffsets[segmentIndex]
    let ctOffset = index.ciphertextOffsets[segmentIndex]
    let ctLen = index.ciphertextLengths[segmentIndex]

    try handle.seek(toOffset: UInt64(segHeaderOffset))
    let segHeader = try handle.read(upToCount: SegmentedFileIndex.segmentHeaderSize) ?? Data()
    if segHeader.count != SegmentedFileIndex.segmentHeaderSize { throw NSError(domain: "ExpoSegmentedAudio", code: 40) }
    let nonceBytes = segHeader.prefix(12)
    let ct = try readExactly(handle: handle, offset: ctOffset, length: ctLen)
    if nonceBytes.count != 12 { throw NSError(domain: "ExpoSegmentedAudio", code: 41) }
    if ct.count < 16 { throw NSError(domain: "ExpoSegmentedAudio", code: 42) }

    let tag = ct.suffix(16)
    let ciphertext = ct.dropLast(16)
    let aad = makeAad(headerBytes: index.fileHeaderBytes, segmentIndex: segmentIndex)
    let sealed = try AES.GCM.SealedBox(nonce: AES.GCM.Nonce(data: nonceBytes), ciphertext: ciphertext, tag: tag)
    let plain = try AES.GCM.open(sealed, using: key, authenticating: aad)
    if plain.count != index.expectedPlaintextLength(segmentIndex: segmentIndex) { throw NSError(domain: "ExpoSegmentedAudio", code: 43) }

    storeCache(segmentIndex: segmentIndex, plaintext: plain)
    return plain
  }

  private func storeCache(segmentIndex: Int, plaintext: Data) {
    cachedSegments[segmentIndex] = plaintext
    touchCache(segmentIndex: segmentIndex)
    while cachedSegmentOrder.count > maximumCachedSegments {
      if let remove = cachedSegmentOrder.first {
        cachedSegmentOrder.removeFirst()
        cachedSegments.removeValue(forKey: remove)
      } else {
        break
      }
    }
  }

  private func touchCache(segmentIndex: Int) {
    if let idx = cachedSegmentOrder.firstIndex(of: segmentIndex) {
      cachedSegmentOrder.remove(at: idx)
    }
    cachedSegmentOrder.append(segmentIndex)
  }

  private func makeAad(headerBytes: Data, segmentIndex: Int) -> Data {
    var out = Data()
    out.append(headerBytes)
    out.append(writeUInt32BE(UInt32(segmentIndex)))
    return out
  }

  private func writeUInt32BE(_ v: UInt32) -> Data {
    var x = v.bigEndian
    return Data(bytes: &x, count: 4)
  }

  private func readExactly(handle: FileHandle, offset: Int64, length: Int) throws -> Data {
    try handle.seek(toOffset: UInt64(offset))
    var out = Data()
    out.reserveCapacity(length)
    var remaining = length
    while remaining > 0 {
      let chunk = try handle.read(upToCount: remaining) ?? Data()
      if chunk.isEmpty { break }
      out.append(chunk)
      remaining -= chunk.count
    }
    if out.count != length { throw NSError(domain: "ExpoSegmentedAudio", code: 44) }
    return out
  }
}


