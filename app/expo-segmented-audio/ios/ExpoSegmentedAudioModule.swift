import ExpoModulesCore
import Foundation
import CryptoKit

public final class ExpoSegmentedAudioModule: Module {
  private var audioPlayer: SegmentedAudioPlayer?

  public func definition() -> ModuleDefinition {
    Name("ExpoSegmentedAudio")

    Events(
      "player_buffering",
      "player_ready",
      "player_ended",
      "player_error",
      "player_position"
    )

    Function("isAvailable") { () -> Bool in
      true
    }

    Function("ping") { () -> String in
      "ok"
    }

    AsyncFunction("encryptFile") { (
      inputPath: String,
      outputPath: String,
      keyBase64: String
    ) async throws -> Bool in
      let inputUrl = URL(fileURLWithPath: inputPath)
      let outputUrl = URL(fileURLWithPath: outputPath)

      guard FileManager.default.fileExists(atPath: inputUrl.path) else { return false }

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      let plain = try Data(contentsOf: inputUrl)
      let key = SymmetricKey(data: keyData)
      let nonce = try AES.GCM.Nonce()
      let sealed = try AES.GCM.seal(plain, using: key, nonce: nonce)

      let nonceBytes = Data(nonce)
      var cipherData = Data()
      cipherData.append(sealed.ciphertext)
      cipherData.append(sealed.tag)

      var out = Data()
      out.append(Data("CSA1".utf8))
      out.append(nonceBytes)
      out.append(cipherData)

      try FileManager.default.createDirectory(
        at: outputUrl.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )

      try out.write(to: outputUrl, options: .atomic)
      return true
    }

    AsyncFunction("decryptFile") { (
      inputPath: String,
      outputPath: String,
      keyBase64: String
    ) async throws -> Bool in
      let inputUrl = URL(fileURLWithPath: inputPath)
      let outputUrl = URL(fileURLWithPath: outputPath)

      guard FileManager.default.fileExists(atPath: inputUrl.path) else { return false }

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      let data = try Data(contentsOf: inputUrl)
      guard data.count >= 32 else { return false }
      guard data.prefix(4) == Data("CSA1".utf8) else { return false }

      let nonceBytes = data.subdata(in: 4..<16)
      let cipherData = data.subdata(in: 16..<data.count)

      let tag = cipherData.suffix(16)
      let ciphertext = cipherData.dropLast(16)

      let nonce = try AES.GCM.Nonce(data: nonceBytes)
      let key = SymmetricKey(data: keyData)
      let sealed = try AES.GCM.SealedBox(
        nonce: nonce,
        ciphertext: ciphertext,
        tag: tag
      )

      let plain = try AES.GCM.open(sealed, using: key)

      try FileManager.default.createDirectory(
        at: outputUrl.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )

      try plain.write(to: outputUrl, options: .atomic)
      return true
    }

    AsyncFunction("encryptText") { (
      text: String,
      outputPath: String,
      keyBase64: String
    ) async throws -> Bool in
      let outputUrl = URL(fileURLWithPath: outputPath)

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      let key = SymmetricKey(data: keyData)
      let nonce = try AES.GCM.Nonce()
      let sealed = try AES.GCM.seal(Data(text.utf8), using: key, nonce: nonce)

      let nonceB64 = Data(nonce).base64EncodedString()
      let cipherData = sealed.ciphertext + sealed.tag
      let cipherB64 = cipherData.base64EncodedString()

      let json = """
      {"v":1,"alg":"gcm","nonce":"\(nonceB64)","ct":"\(cipherB64)"}
      """

      try FileManager.default.createDirectory(
        at: outputUrl.deletingLastPathComponent(),
        withIntermediateDirectories: true
      )

      try Data(json.utf8).write(to: outputUrl, options: .atomic)
      return true
    }

    AsyncFunction("decryptText") { (
      inputPath: String,
      keyBase64: String
    ) async throws -> String in
      let inputUrl = URL(fileURLWithPath: inputPath)
      guard FileManager.default.fileExists(atPath: inputUrl.path) else { return "" }

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return "" }

      let jsonText = try String(contentsOf: inputUrl, encoding: .utf8)

      guard
        let nonceB64 = Self.extractJsonValue(jsonText, key: "nonce"),
        let ctB64 = Self.extractJsonValue(jsonText, key: "ct"),
        let nonceBytes = Data(base64Encoded: nonceB64),
        let cipherData = Data(base64Encoded: ctB64),
        cipherData.count >= 16
      else {
        return ""
      }

      let tag = cipherData.suffix(16)
      let ciphertext = cipherData.dropLast(16)

      let nonce = try AES.GCM.Nonce(data: nonceBytes)
      let key = SymmetricKey(data: keyData)
      let sealed = try AES.GCM.SealedBox(
        nonce: nonce,
        ciphertext: ciphertext,
        tag: tag
      )

      let plain = try AES.GCM.open(sealed, using: key)
      return String(data: plain, encoding: .utf8) ?? ""
    }

    AsyncFunction("encryptToSegmentedWithKey") { (
      inputPath: String,
      outputPathTmp: String,
      keyBase64: String,
      segmentSize: Int
    ) async throws -> Bool in
      let inputUrl = URL(fileURLWithPath: inputPath)
      let outputUrl = URL(fileURLWithPath: outputPathTmp)

      guard FileManager.default.fileExists(atPath: inputUrl.path) else { return false }

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      return try SegmentedFileCrypto.encryptToSegmentedGcm(
        inputUrl: inputUrl,
        outputUrl: outputUrl,
        keyData: keyData,
        segmentSize: segmentSize
      )
    }

    AsyncFunction("decryptSegmentedToFile") { (
      inputPath: String,
      outputPath: String,
      keyBase64: String
    ) async throws -> Bool in
      let inputUrl = URL(fileURLWithPath: inputPath)
      let outputUrl = URL(fileURLWithPath: outputPath)

      guard FileManager.default.fileExists(atPath: inputUrl.path) else { return false }

      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      return try SegmentedFileCrypto.decryptSegmentedGcmToFile(
        inputUrl: inputUrl,
        outputUrl: outputUrl,
        keyData: keyData
      )
    }

    Function("playerRegisterToken") { (
      token: String,
      path: String,
      keyBase64: String,
      segmentSize: Int,
      mimeType: String?
    ) -> Bool in
      let keyData = Data(base64Encoded: keyBase64) ?? Data()
      guard Self.isValidAesKeyLength(keyData.count) else { return false }

      SegmentedRegistry.shared.put(
        token: token,
        entry: .init(
          path: path,
          keyData: keyData,
          segmentSize: segmentSize,
          mimeType: mimeType
        )
      )

      return true
    }

    AsyncFunction("playerLoad") { (token: String) async throws -> Bool in
      guard let entry = SegmentedRegistry.shared.get(token: token) else {
        return false
      }

      audioPlayer?.unload()

      audioPlayer = SegmentedAudioPlayer(
        token: token,
        entry: entry,
        sendEvent: { [weak self] name, payload in
          let body: [String: Any] = payload ?? [:]
          self?.sendEvent(name, body)
        }
      )

      try audioPlayer?.load()
      return true
    }

    AsyncFunction("playerPlay") { () async -> Bool in
      audioPlayer?.play()
      return true
    }

    AsyncFunction("playerPause") { () async -> Bool in
      audioPlayer?.pause()
      return true
    }

    AsyncFunction("playerSeekTo") { (positionMs: Double) async -> Bool in
      audioPlayer?.seekTo(positionMs: positionMs)
      return true
    }

    AsyncFunction("playerUnload") { () async -> Bool in
      audioPlayer?.unload()
      audioPlayer = nil
      return true
    }
  }

  private static func isValidAesKeyLength(_ length: Int) -> Bool {
    length == 16 || length == 24 || length == 32
  }

  private static func extractJsonValue(_ text: String, key: String) -> String? {
    let needle = "\"\(key)\":\""
    guard let start = text.range(of: needle) else { return nil }
    let after = text[start.upperBound...]
    guard let end = after.firstIndex(of: "\"") else { return nil }
    return String(after[..<end])
  }
}
