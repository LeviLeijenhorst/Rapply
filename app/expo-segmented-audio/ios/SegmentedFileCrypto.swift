import Foundation
import CryptoKit
import Security

enum SegmentedFileCrypto {
  static func encryptToSegmentedGcm(inputUrl: URL, outputUrl: URL, keyData: Data, segmentSize: Int) throws -> Bool {
    if segmentSize <= 0 || segmentSize > 1024 * 1024 { return false }
    if !FileManager.default.fileExists(atPath: inputUrl.path) { return false }

    let attrs = try FileManager.default.attributesOfItem(atPath: inputUrl.path)
    let fileLen = (attrs[.size] as? NSNumber)?.int64Value ?? 0
    if fileLen < 0 { return false }
    let segmentCount = fileLen == 0 ? 0 : Int((fileLen + Int64(segmentSize) - 1) / Int64(segmentSize))

    let headerBytes = makeHeaderBytes(segmentSize: segmentSize, fileLen: fileLen, segmentCount: segmentCount)
    let key = SymmetricKey(data: keyData)

    try FileManager.default.createDirectory(at: outputUrl.deletingLastPathComponent(), withIntermediateDirectories: true)
    if FileManager.default.fileExists(atPath: outputUrl.path) {
      try FileManager.default.removeItem(at: outputUrl)
    }

    let inHandle = try FileHandle(forReadingFrom: inputUrl)
    defer { try? inHandle.close() }
    let outHandle = try FileHandle(forWritingTo: outputUrl)
    defer { try? outHandle.close() }

    try outHandle.write(contentsOf: headerBytes)

    for index in 0..<segmentCount {
      let toRead: Int
      if index == segmentCount - 1 {
        let full = Int64(segmentCount - 1) * Int64(segmentSize)
        toRead = Int(fileLen - full)
      } else {
        toRead = segmentSize
      }
      let plain = try inHandle.read(upToCount: toRead) ?? Data()
      if plain.count != toRead { return false }

      let nonceData = randomBytes(count: 12)
      let nonce = try AES.GCM.Nonce(data: nonceData)
      let aad = makeAad(headerBytes: headerBytes, segmentIndex: index)
      let sealed = try AES.GCM.seal(plain, using: key, nonce: nonce, authenticating: aad)

      var ciphertextAndTag = Data()
      ciphertextAndTag.append(sealed.ciphertext)
      ciphertextAndTag.append(sealed.tag)

      try outHandle.write(contentsOf: nonceData)
      try outHandle.write(contentsOf: writeUInt32BE(UInt32(ciphertextAndTag.count)))
      try outHandle.write(contentsOf: ciphertextAndTag)
    }

    try outHandle.synchronize()
    return true
  }

  static func decryptSegmentedGcmToFile(inputUrl: URL, outputUrl: URL, keyData: Data) throws -> Bool {
    if !FileManager.default.fileExists(atPath: inputUrl.path) { return false }
    let index = try SegmentedFileIndex(url: inputUrl)
    let key = SymmetricKey(data: keyData)

    try FileManager.default.createDirectory(at: outputUrl.deletingLastPathComponent(), withIntermediateDirectories: true)
    if FileManager.default.fileExists(atPath: outputUrl.path) {
      try FileManager.default.removeItem(at: outputUrl)
    }

    let inHandle = try FileHandle(forReadingFrom: inputUrl)
    defer { try? inHandle.close() }
    let outHandle = try FileHandle(forWritingTo: outputUrl)
    defer { try? outHandle.close() }

    for segmentIndex in 0..<index.segmentCount {
      let segHeaderOffset = index.segmentHeaderOffsets[segmentIndex]
      let ctOffset = index.ciphertextOffsets[segmentIndex]
      let ctLen = index.ciphertextLengths[segmentIndex]

      try inHandle.seek(toOffset: UInt64(segHeaderOffset))
      let segHeader = try inHandle.read(upToCount: SegmentedFileIndex.segmentHeaderSize) ?? Data()
      if segHeader.count != SegmentedFileIndex.segmentHeaderSize { return false }
      let nonce = segHeader.prefix(12)
      let ct = try readExactly(handle: inHandle, offset: ctOffset, length: ctLen)
      if ct.count != ctLen { return false }
      if nonce.count != 12 { return false }
      if ct.count < 16 { return false }

      let tag = ct.suffix(16)
      let ciphertext = ct.dropLast(16)
      let aad = makeAad(headerBytes: index.fileHeaderBytes, segmentIndex: segmentIndex)
      let sealed = try AES.GCM.SealedBox(nonce: AES.GCM.Nonce(data: nonce), ciphertext: ciphertext, tag: tag)
      let plain = try AES.GCM.open(sealed, using: key, authenticating: aad)
      if plain.count != index.expectedPlaintextLength(segmentIndex: segmentIndex) { return false }
      try outHandle.write(contentsOf: plain)
    }
    try outHandle.synchronize()
    return true
  }

  private static func makeHeaderBytes(segmentSize: Int, fileLen: Int64, segmentCount: Int) -> Data {
    var data = Data()
    data.append(Data("CSG1".utf8))
    data.append(writeUInt32BE(2))
    data.append(writeUInt32BE(1))
    data.append(writeUInt32BE(UInt32(segmentSize)))
    data.append(writeUInt64BE(UInt64(fileLen)))
    data.append(writeUInt32BE(UInt32(segmentCount)))
    return data
  }

  private static func makeAad(headerBytes: Data, segmentIndex: Int) -> Data {
    var out = Data()
    out.append(headerBytes)
    out.append(writeUInt32BE(UInt32(segmentIndex)))
    return out
  }

  private static func randomBytes(count: Int) -> Data {
    var bytes = [UInt8](repeating: 0, count: count)
    _ = SecRandomCopyBytes(kSecRandomDefault, count, &bytes)
    return Data(bytes)
  }

  private static func writeUInt32BE(_ v: UInt32) -> Data {
    var x = v.bigEndian
    return Data(bytes: &x, count: 4)
  }

  private static func writeUInt64BE(_ v: UInt64) -> Data {
    var x = v.bigEndian
    return Data(bytes: &x, count: 8)
  }

  private static func readExactly(handle: FileHandle, offset: Int64, length: Int) throws -> Data {
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
    return out
  }
}


