import Foundation
import AVFoundation

final class SegmentedAudioPlayer: NSObject {
  private let token: String
  private let entry: SegmentedRegistry.Entry
  private let sendEvent: (String, [String: Any]?) -> Void

  private var resourceLoader: SegmentedDecryptingResourceLoader?
  private var player: AVPlayer?
  private var playerItem: AVPlayerItem?

  private var statusObserver: NSKeyValueObservation?
  private var timeControlObserver: NSKeyValueObservation?
  private var playbackBufferEmptyObserver: NSKeyValueObservation?
  private var playbackLikelyToKeepUpObserver: NSKeyValueObservation?
  private var didEndObserver: NSObjectProtocol?

  init(token: String, entry: SegmentedRegistry.Entry, sendEvent: @escaping (String, [String: Any]?) -> Void) {
    self.token = token
    self.entry = entry
    self.sendEvent = sendEvent
  }

  func load() throws {
    let url = URL(string: "segfile://\(token)")!
    let asset = AVURLAsset(url: url)
    let loader = try SegmentedDecryptingResourceLoader(token: token, entry: entry)
    asset.resourceLoader.setDelegate(loader, queue: DispatchQueue(label: "ExpoSegmentedAudio.ResourceLoaderQueue"))
    resourceLoader = loader

    let item = AVPlayerItem(asset: asset)
    playerItem = item
    let p = AVPlayer(playerItem: item)
    player = p

    statusObserver = item.observe(\.status, options: [.initial, .new]) { [weak self] item, _ in
      guard let self else { return }
      switch item.status {
      case .readyToPlay:
        self.sendEvent("player_ready", nil)
      case .failed:
        let msg = item.error?.localizedDescription ?? "unknown"
        self.sendEvent("player_error", ["message": msg])
      default:
        break
      }
    }

    timeControlObserver = p.observe(\.timeControlStatus, options: [.new]) { [weak self] player, _ in
      guard let self else { return }
      if player.timeControlStatus == .waitingToPlayAtSpecifiedRate {
        self.sendEvent("player_buffering", nil)
      }
    }

    playbackBufferEmptyObserver = item.observe(\.isPlaybackBufferEmpty, options: [.new]) { [weak self] item, _ in
      guard let self else { return }
      if item.isPlaybackBufferEmpty {
        self.sendEvent("player_buffering", nil)
      }
    }

    playbackLikelyToKeepUpObserver = item.observe(\.isPlaybackLikelyToKeepUp, options: [.new]) { [weak self] item, _ in
      guard let self else { return }
      if item.isPlaybackLikelyToKeepUp && item.status == .readyToPlay {
        self.sendEvent("player_ready", nil)
      }
    }

    didEndObserver = NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: item,
      queue: nil
    ) { [weak self] _ in
      self?.sendEvent("player_ended", nil)
    }
  }

  func play() {
    player?.play()
  }

  func pause() {
    player?.pause()
  }

  func seekTo(positionMs: Double) {
    let ms = max(0, positionMs)
    let t = CMTime(value: Int64(ms), timescale: 1000)
    player?.seek(to: t, toleranceBefore: .zero, toleranceAfter: .zero)
  }

  func unload() {
    if let didEndObserver {
      NotificationCenter.default.removeObserver(didEndObserver)
    }
    didEndObserver = nil
    statusObserver = nil
    timeControlObserver = nil
    playbackBufferEmptyObserver = nil
    playbackLikelyToKeepUpObserver = nil
    player?.pause()
    playerItem = nil
    player = nil
    resourceLoader = nil
  }
}


