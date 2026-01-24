import Foundation

final class SegmentedFileIndex {
  let url: URL
  let fileSize: Int64
  let version: Int
  let cipherCode: Int
  let segmentSize: Int
  let plaintextLength: Int64
  let segmentCount: Int
  let fileHeaderBytes: Data
  let segmentHeaderOffsets: [Int64]
  let ciphertextOffsets: [Int64]
  let ciphertextLengths: [Int]

  static let fileHeaderSize = 4 + 4 + 4 + 4 + 8 + 4
  static let segmentHeaderSize = 16

  init(url: URL) throws {
    self.url = url
    let attrs = try FileManager.default.attributesOfItem(atPath: url.path)
    let size = (attrs[.size] as? NSNumber)?.int64Value ?? 0
    fileSize = size

    let fh = try FileHandle(forReadingFrom: url)
    defer { try? fh.close() }

    let header = try fh.read(upToCount: Self.fileHeaderSize) ?? Data()
    if header.count != Self.fileHeaderSize { throw NSError(domain: "ExpoSegmentedAudio", code: 1) }
    fileHeaderBytes = header

    let magic = header.prefix(4)
    if magic != Data("CSG1".utf8) { throw NSError(domain: "ExpoSegmentedAudio", code: 2) }
    version = Int(Self.readUInt32BE(header, offset: 4))
    cipherCode = Int(Self.readUInt32BE(header, offset: 8))
    segmentSize = Int(Self.readUInt32BE(header, offset: 12))
    plaintextLength = Int64(bitPattern: Self.readUInt64BE(header, offset: 16))
    segmentCount = Int(Self.readUInt32BE(header, offset: 24))

    if version != 2 { throw NSError(domain: "ExpoSegmentedAudio", code: 3) }
    if cipherCode != 1 { throw NSError(domain: "ExpoSegmentedAudio", code: 4) }
    if segmentSize <= 0 || segmentSize > 1024 * 1024 { throw NSError(domain: "ExpoSegmentedAudio", code: 5) }
    if plaintextLength < 0 { throw NSError(domain: "ExpoSegmentedAudio", code: 6) }
    let expectedSegmentCount = plaintextLength == 0 ? 0 : Int((plaintextLength + Int64(segmentSize) - 1) / Int64(segmentSize))
    if segmentCount != expectedSegmentCount { throw NSError(domain: "ExpoSegmentedAudio", code: 7) }

    let minEncryptedSize = Int64(Self.fileHeaderSize) + Int64(segmentCount) * Int64(Self.segmentHeaderSize)
    if fileSize < minEncryptedSize { throw NSError(domain: "ExpoSegmentedAudio", code: 8) }

    var headerOffsets: [Int64] = []
    var ctOffsets: [Int64] = []
    var ctLens: [Int] = []
    headerOffsets.reserveCapacity(segmentCount)
    ctOffsets.reserveCapacity(segmentCount)
    ctLens.reserveCapacity(segmentCount)

    var offset: Int64 = Int64(Self.fileHeaderSize)
    for _ in 0..<segmentCount {
      if offset + Int64(Self.segmentHeaderSize) > fileSize { throw NSError(domain: "ExpoSegmentedAudio", code: 9) }
      try fh.seek(toOffset: UInt64(offset))
      let segHeader = try fh.read(upToCount: Self.segmentHeaderSize) ?? Data()
      if segHeader.count != Self.segmentHeaderSize { throw NSError(domain: "ExpoSegmentedAudio", code: 10) }
      let len = Int(Self.readUInt32BE(segHeader, offset: 12))
      if len < 16 { throw NSError(domain: "ExpoSegmentedAudio", code: 11) }
      if len > segmentSize + 16 { throw NSError(domain: "ExpoSegmentedAudio", code: 12) }
      let ctStart = offset + Int64(Self.segmentHeaderSize)
      let ctEnd = ctStart + Int64(len)
      if ctEnd > fileSize { throw NSError(domain: "ExpoSegmentedAudio", code: 13) }
      headerOffsets.append(offset)
      ctOffsets.append(ctStart)
      ctLens.append(len)
      offset = ctEnd
    }
    segmentHeaderOffsets = headerOffsets
    ciphertextOffsets = ctOffsets
    ciphertextLengths = ctLens
  }

  func expectedPlaintextLength(segmentIndex: Int) -> Int {
    if segmentCount == 0 { return 0 }
    if segmentIndex == segmentCount - 1 {
      let full = Int64(segmentCount - 1) * Int64(segmentSize)
      return Int(plaintextLength - full)
    }
    return segmentSize
  }

  private static func readUInt32BE(_ data: Data, offset: Int) -> UInt32 {
    let b0 = UInt32(data[offset + 0])
    let b1 = UInt32(data[offset + 1])
    let b2 = UInt32(data[offset + 2])
    let b3 = UInt32(data[offset + 3])
    return (b0 << 24) | (b1 << 16) | (b2 << 8) | b3
  }

  private static func readUInt64BE(_ data: Data, offset: Int) -> UInt64 {
    var v: UInt64 = 0
    for i in 0..<8 {
      v = (v << 8) | UInt64(data[offset + i])
    }
    return v
  }
}


