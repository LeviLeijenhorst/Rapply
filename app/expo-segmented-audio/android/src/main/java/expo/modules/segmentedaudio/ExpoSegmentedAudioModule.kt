package expo.modules.segmentedaudio

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.source.DefaultMediaSourceFactory
import com.google.android.exoplayer2.source.ProgressiveMediaSource
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory
import com.google.android.exoplayer2.audio.AudioAttributes
import com.google.android.exoplayer2.C
import android.util.Log
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.CipherOutputStream
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.math.ceil
import kotlin.math.min
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext

class ExpoSegmentedAudioModule : Module() {
  private val tag = "ExpoSegmentedAudio"
  private var player: ExoPlayer? = null

  private fun requireAesKeyBytes(keyBytes: ByteArray) {
    require(keyBytes.size == 16 || keyBytes.size == 24 || keyBytes.size == 32) { "AES key must be 16/24/32 bytes" }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoSegmentedAudio")
    Events("player_buffering", "player_ready", "player_ended", "player_error", "player_position")
    Function("isAvailable") { true }
    Function("ping") { "ok" }

    AsyncFunction("encryptFile") { inputPath: String, outputPath: String, keyBase64: String ->
      val inFile = File(inputPath)
      if (!inFile.exists()) return@AsyncFunction false
      val outFile = File(outputPath)
      outFile.parentFile?.mkdirs()
      val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
      requireAesKeyBytes(keyBytes)
      val key = SecretKeySpec(keyBytes, "AES")
      val nonce = ByteArray(12)
      SecureRandom().nextBytes(nonce)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, nonce))
      FileInputStream(inFile).use { fileInputStream ->
        FileOutputStream(outFile).use { fileOutputStream ->
          fileOutputStream.write("CSA1".toByteArray(Charsets.US_ASCII))
          fileOutputStream.write(nonce)
          CipherOutputStream(fileOutputStream, cipher).use { cipherOutputStream ->
            val buf = ByteArray(128 * 1024)
            while (true) {
              val r = fileInputStream.read(buf)
              if (r <= 0) break
              cipherOutputStream.write(buf, 0, r)
            }
          }
        }
      }
      outFile.length() > 0L
    }

    AsyncFunction("decryptFile") { inputPath: String, outputPath: String, keyBase64: String ->
      val inFile = File(inputPath)
      if (!inFile.exists()) return@AsyncFunction false
      val outFile = File(outputPath)
      outFile.parentFile?.mkdirs()
      val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
      requireAesKeyBytes(keyBytes)
      val key = SecretKeySpec(keyBytes, "AES")
      FileInputStream(inFile).use { fileInputStream ->
        val header = ByteArray(16)
        var got = 0
        while (got < header.size) {
          val r = fileInputStream.read(header, got, header.size - got)
          if (r <= 0) return@AsyncFunction false
          got += r
        }
        val magic = String(header, 0, 4, Charsets.US_ASCII)
        if (magic != "CSA1") return@AsyncFunction false
        val nonce = header.copyOfRange(4, 16)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
        CipherInputStream(fileInputStream, cipher).use { cipherInputStream ->
          FileOutputStream(outFile).use { fos ->
            val buf = ByteArray(128 * 1024)
            while (true) {
              val r = cipherInputStream.read(buf)
              if (r <= 0) break
              fos.write(buf, 0, r)
            }
          }
        }
      }
      outFile.length() > 0L
    }

    AsyncFunction("decryptSegmentedToFile") { inputPath: String, outputPath: String, keyBase64: String ->
      runBlocking {
        withContext(Dispatchers.IO) {
          val inFile = File(inputPath)
          if (!inFile.exists()) return@withContext false
          val outFile = File(outputPath)
          outFile.parentFile?.mkdirs()

          val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
          requireAesKeyBytes(keyBytes)
          val key = SecretKeySpec(keyBytes, "AES")

          val fileHeaderSizeBytes = 4 + 4 + 4 + 4 + 8 + 4
          val segmentHeaderSizeBytes = 16
          val aesGcmTagSizeBytes = 16
          val maximumSegmentSizeBytes = 1024 * 1024

          FileInputStream(inFile).use { fis ->
            val fileHeaderBytes = ByteArray(fileHeaderSizeBytes)
            var got = 0
            while (got < fileHeaderBytes.size) {
              val r = fis.read(fileHeaderBytes, got, fileHeaderBytes.size - got)
              if (r <= 0) return@withContext false
              got += r
            }
            val bb = ByteBuffer.wrap(fileHeaderBytes).order(ByteOrder.BIG_ENDIAN)
            val magic = ByteArray(4)
            bb.get(magic)
            val magicStr = String(magic, Charsets.US_ASCII)
            if (magicStr != "CSG1") return@withContext false
            val version = bb.int
            if (version != 2) return@withContext false
            val cipherCode = bb.int
            if (cipherCode != 1) return@withContext false
            val segmentSizeBytes = bb.int
            val plainLen = bb.long
            val segmentCount = bb.int

            if (segmentSizeBytes <= 0 || segmentSizeBytes > maximumSegmentSizeBytes) return@withContext false
            if (plainLen < 0L) return@withContext false
            val expectedSegmentCount = if (plainLen == 0L) 0 else ceil(plainLen.toDouble() / segmentSizeBytes).toInt()
            if (segmentCount != expectedSegmentCount) return@withContext false

            FileOutputStream(outFile).use { fos ->
              var offset = fileHeaderSizeBytes.toLong()
              val segIndexBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN)
              val segHdr = ByteArray(segmentHeaderSizeBytes)
              for (index in 0 until segmentCount) {
                fis.channel.position(offset)
                var hGot = 0
                while (hGot < segHdr.size) {
                  val r = fis.read(segHdr, hGot, segHdr.size - hGot)
                  if (r <= 0) return@withContext false
                  hGot += r
                }
                val nonce = segHdr.copyOfRange(0, 12)
                val ctLen = ByteBuffer.wrap(segHdr, 12, 4).order(ByteOrder.BIG_ENDIAN).int
                if (ctLen < aesGcmTagSizeBytes) return@withContext false
                if (ctLen > segmentSizeBytes + aesGcmTagSizeBytes) return@withContext false
                val ciphertext = ByteArray(ctLen)
                var cGot = 0
                while (cGot < ciphertext.size) {
                  val r = fis.read(ciphertext, cGot, ciphertext.size - cGot)
                  if (r <= 0) return@withContext false
                  cGot += r
                }
                offset = offset + segmentHeaderSizeBytes + ctLen.toLong()
                val cipher = Cipher.getInstance("AES/GCM/NoPadding")
                cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
                cipher.updateAAD(fileHeaderBytes)
                segIndexBuf.clear()
                segIndexBuf.putInt(index)
                cipher.updateAAD(segIndexBuf.array())
                val plain = cipher.doFinal(ciphertext)
                fos.write(plain)
              }
              fos.flush()
            }
          }
          outFile.length() > 0L || inFile.length() == 0L
        }
      }
    }

    AsyncFunction("encryptText") { text: String, outputPath: String, keyBase64: String ->
      val outFile = File(outputPath)
      outFile.parentFile?.mkdirs()
      val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
      requireAesKeyBytes(keyBytes)
      val key = SecretKeySpec(keyBytes, "AES")
      val nonce = ByteArray(12)
      SecureRandom().nextBytes(nonce)
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.ENCRYPT_MODE, key, GCMParameterSpec(128, nonce))
      val plain = text.toByteArray(Charsets.UTF_8)
      val ciphertext = cipher.doFinal(plain)
      val nonceB64 = android.util.Base64.encodeToString(nonce, android.util.Base64.NO_WRAP)
      val ctB64 = android.util.Base64.encodeToString(ciphertext, android.util.Base64.NO_WRAP)
      val json = "{\"v\":1,\"alg\":\"gcm\",\"nonce\":\"$nonceB64\",\"ct\":\"$ctB64\"}"
      FileOutputStream(outFile).use { fos -> fos.write(json.toByteArray(Charsets.UTF_8)) }
      outFile.length() > 0L
    }

    AsyncFunction("decryptText") { inputPath: String, keyBase64: String ->
      val inFile = File(inputPath)
      if (!inFile.exists()) return@AsyncFunction ""
      val jsonText = FileInputStream(inFile).use { fis -> fis.readBytes().toString(Charsets.UTF_8) }
      val nonceKey = "\"nonce\":\""
      val ctKey = "\"ct\":\""
      val nonceStart = jsonText.indexOf(nonceKey)
      val ctStart = jsonText.indexOf(ctKey)
      if (nonceStart < 0 || ctStart < 0) return@AsyncFunction ""
      val nonceEnd = jsonText.indexOf("\"", nonceStart + nonceKey.length)
      val ctEnd = jsonText.indexOf("\"", ctStart + ctKey.length)
      if (nonceEnd < 0 || ctEnd < 0) return@AsyncFunction ""
      val nonceB64 = jsonText.substring(nonceStart + nonceKey.length, nonceEnd)
      val ctB64 = jsonText.substring(ctStart + ctKey.length, ctEnd)
      val nonce = android.util.Base64.decode(nonceB64, android.util.Base64.DEFAULT)
      val ciphertext = android.util.Base64.decode(ctB64, android.util.Base64.DEFAULT)
      val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
      requireAesKeyBytes(keyBytes)
      if (nonce.size != 12) return@AsyncFunction ""
      if (ciphertext.size < 16) return@AsyncFunction ""
      val key = SecretKeySpec(keyBytes, "AES")
      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, nonce))
      val plain = cipher.doFinal(ciphertext)
      String(plain, Charsets.UTF_8)
    }

    AsyncFunction("encryptToSegmentedWithKey") { inputPath: String, outputPathTmp: String, keyBase64: String, segmentSize: Int ->
      runBlocking {
        withContext(Dispatchers.IO) {
          val inFile = File(inputPath)
          val outFile = File(outputPathTmp)
          if (!inFile.exists()) {
            Log.e(tag, "encrypt: input file not found: $inputPath")
            return@withContext false
          }
          outFile.parentFile?.mkdirs()
          Log.d(tag, "encrypt: start inputLen=${inFile.length()} output=$outputPathTmp")

          val keyBytes = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
          requireAesKeyBytes(keyBytes)
          val inLen = inFile.length()
          val segmentSizeBytes = if (segmentSize <= 0) 64 * 1024 else segmentSize
          require(segmentSizeBytes in 1..(1024 * 1024)) { "Segment size must be 1..1048576 bytes" }
          val segmentCount = if (inLen == 0L) 0 else ceil(inLen.toDouble() / segmentSizeBytes).toInt()
          val rnd = SecureRandom()
          var segmentsWritten = 0
          FileInputStream(inFile).use { fis ->
            FileOutputStream(outFile).use { fos ->
              val header = ByteBuffer.allocate(4 + 4 + 4 + 4 + 8 + 4).order(ByteOrder.BIG_ENDIAN)
              header.put("CSG1".toByteArray(Charsets.US_ASCII))
              header.putInt(2)
              header.putInt(1)
              header.putInt(segmentSizeBytes)
              header.putLong(inLen)
              header.putInt(segmentCount)
              val headerBytes = header.array()
              fos.write(headerBytes)

              val key = SecretKeySpec(keyBytes, "AES")
              val inBuf = ByteArray(segmentSizeBytes)
              var totalRead = 0L
              var segmentsSinceYield = 0
              while (totalRead < inLen) {
                val toRead = min(segmentSizeBytes.toLong(), inLen - totalRead).toInt()
                var read = 0
                while (read < toRead) {
                  val r = fis.read(inBuf, read, toRead - read)
                  if (r <= 0) break
                  read += r
                }
                if (read == 0 && totalRead < inLen) {
                  throw IOException("Unexpected EOF: read $totalRead of $inLen bytes")
                }
                totalRead += read
                val nonce = ByteArray(12)
                rnd.nextBytes(nonce)
                val cipher = Cipher.getInstance("AES/GCM/NoPadding")
                val spec = GCMParameterSpec(128, nonce)
                cipher.init(Cipher.ENCRYPT_MODE, key, spec)
                cipher.updateAAD(headerBytes)
                val segmentIndexBytes = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(segmentsWritten).array()
                cipher.updateAAD(segmentIndexBytes)
                val ciphertext = cipher.doFinal(inBuf, 0, read)
                fos.write(nonce)
                val lenBuf = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(ciphertext.size).array()
                fos.write(lenBuf)
                fos.write(ciphertext)
                segmentsWritten++
                segmentsSinceYield++
                if (segmentsSinceYield >= 5) {
                  delay(1)
                  segmentsSinceYield = 0
                }
              }
              if (totalRead != inLen) {
                throw IOException("Read mismatch: expected $inLen bytes, read $totalRead bytes")
              }
              if (segmentsWritten != segmentCount) {
                throw IOException("Segment count mismatch: expected $segmentCount segments, wrote $segmentsWritten")
              }
              fos.flush()
            }
          }
          val finalSize = outFile.length()
          Log.d(tag, "encrypt: done segments=$segmentsWritten expectedSegments=$segmentCount outputSize=$finalSize")
          if (finalSize == 0L) {
            Log.e(tag, "encrypt: output file is empty")
            return@withContext false
          }
          true
        }
      }
    }

    Function("segmentInfo") { inputPath: String ->
      val inFile = File(inputPath)
      if (!inFile.exists()) {
        return@Function mapOf(
          "version" to 0,
          "cipher" to "none",
          "segmentSize" to 0,
          "segmentCount" to 0,
          "fileLength" to 0L
        )
      }
      FileInputStream(inFile).use { fis ->
        val hdr = ByteArray(4 + 4 + 4 + 4 + 8 + 4)
        val r = fis.read(hdr)
        if (r != hdr.size) {
          val len = inFile.length()
          val segSize = 64 * 1024
          val count = if (len == 0L) 0 else ceil(len.toDouble() / segSize).toInt()
          return@Function mapOf(
            "version" to 1,
            "cipher" to "none",
            "segmentSize" to segSize,
            "segmentCount" to count,
            "fileLength" to len
          )
        }
        val bb = ByteBuffer.wrap(hdr).order(ByteOrder.BIG_ENDIAN)
        val magic = ByteArray(4)
        bb.get(magic)
        val magicStr = String(magic, Charsets.US_ASCII)
        if (magicStr != "CSG1") {
          val len = inFile.length()
          val segSize = 64 * 1024
          val count = if (len == 0L) 0 else ceil(len.toDouble() / segSize).toInt()
          return@Function mapOf(
            "version" to 1,
            "cipher" to "none",
            "segmentSize" to segSize,
            "segmentCount" to count,
            "fileLength" to len
          )
        }
        val version = bb.int
        val cipherCode = bb.int
        val segSize = bb.int
        val fileLen = bb.long
        val segCount = bb.int
        val cipherName = if (cipherCode == 1) "gcm" else "none"
        mapOf(
          "version" to version,
          "cipher" to cipherName,
          "segmentSize" to segSize,
          "segmentCount" to segCount,
          "fileLength" to fileLen
        )
      }
    }
  Function("playerRegisterToken") { token: String, path: String, keyBase64: String, segmentSize: Int, mimeType: String? ->
    val key = android.util.Base64.decode(keyBase64, android.util.Base64.DEFAULT)
    SegmentedRegistry.put(token, SegmentedRegistry.Entry(path, key, segmentSize, mimeType))
    true
  }

  AsyncFunction("playerLoad") { token: String ->
    val ctx = requireNotNull(appContext.reactContext)
    player?.release()
    val p = ExoPlayer.Builder(ctx).build()
    val attrs = AudioAttributes.Builder()
      .setUsage(C.USAGE_MEDIA)
      .setContentType(C.CONTENT_TYPE_MUSIC)
      .build()
    p.setAudioAttributes(attrs, true)
    p.volume = 1.0f
    p.addListener(object : Player.Listener {
      override fun onPlaybackStateChanged(state: Int) {
        when (state) {
          Player.STATE_BUFFERING -> this@ExpoSegmentedAudioModule.sendEvent("player_buffering")
          Player.STATE_READY -> this@ExpoSegmentedAudioModule.sendEvent("player_ready")
          Player.STATE_ENDED -> this@ExpoSegmentedAudioModule.sendEvent("player_ended")
        }
      }
      override fun onPlayerError(error: com.google.android.exoplayer2.PlaybackException) {
        val codeName = error.errorCodeName ?: "unknown"
        val causeName = error.cause?.javaClass?.simpleName ?: "none"
        val causeMsg = error.cause?.message ?: "none"
        val causeStack = if (error.cause != null) Log.getStackTraceString(error.cause) else "none"
        val root = run {
          var c: Throwable? = error.cause
          var last: Throwable? = c
          var steps = 0
          while (c?.cause != null && steps < 12) {
            c = c.cause
            last = c
            steps += 1
          }
          last
        }
        val rootName = root?.javaClass?.simpleName ?: "none"
        val rootMsg = root?.message ?: "none"
        val msg = error.message ?: "unknown"
        this@ExpoSegmentedAudioModule.sendEvent(
          "player_error",
          mapOf(
            "message" to msg,
            "code" to codeName,
            "cause" to causeName,
            "causeMessage" to causeMsg,
            "causeStack" to causeStack,
            "rootCause" to rootName,
            "rootCauseMessage" to rootMsg,
          )
        )
      }
    })
    val entry = SegmentedRegistry.get(token)
    val builder = MediaItem.Builder()
      .setUri("segfile://$token")
    val mt = entry?.mimeType
    if (mt != null && mt.isNotEmpty()) {
      builder.setMimeType(mt)
    }
    val mediaItem = builder.build()
    val mediaSource = ProgressiveMediaSource.Factory(SegmentedDataSource.Factory(), DefaultExtractorsFactory())
      .createMediaSource(mediaItem)
    p.setMediaSource(mediaSource)
    p.prepare()
    player = p
    true
  }

  AsyncFunction("playerPlay") {
    val p = player
    if (p != null) {
      p.playWhenReady = true
      p.play()
    }
    true
  }
  AsyncFunction("playerPause") {
    val p = player
    if (p != null) {
      p.playWhenReady = false
      p.pause()
    }
    true
  }
  AsyncFunction("playerSeekTo") { positionMs: Double ->
    player?.seekTo(positionMs.toLong())
    true
  }
  AsyncFunction("playerUnload") {
    player?.release()
    player = null
    true
  }
    }

  private fun copyFile(src: File, dst: File) {
    FileInputStream(src).channel.use { inCh ->
      FileOutputStream(dst).channel.use { outCh ->
        var pos = 0L
        val size = inCh.size()
        while (pos < size) {
          val transferred = inCh.transferTo(pos, min(8L * 1024 * 1024, size - pos), outCh)
          if (transferred <= 0) break
          pos += transferred
        }
      }
    }
  }
}