package expo.modules.segmentedaudio

import android.net.Uri
import android.util.Log
import com.google.android.exoplayer2.C
import com.google.android.exoplayer2.upstream.DataSource
import com.google.android.exoplayer2.upstream.DataSpec
import com.google.android.exoplayer2.upstream.TransferListener
import java.io.EOFException
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec
import kotlin.math.min

class SegmentedDataSource : DataSource {
  private val tag = "SegmentedDataSource"
  private val maximumSegmentSizeBytes = 1024 * 1024
  private val aesGcmTagSizeBytes = 16
  private val segmentHeaderSizeBytes = 16
  private val fileHeaderSizeBytes = 4 + 4 + 4 + 4 + 8 + 4

  private var dataUri: Uri? = null
  private var sourceFile: File? = null
  private var isOpen = false

  private var headerByteCount = 0
  private var fileHeaderBytes: ByteArray = ByteArray(0)
  private var segmentSizeBytes = 0
  private var segmentCount = 0
  private var plainTextLengthBytes = 0L
  private var segmentCiphertextOffsetsBytes: LongArray = LongArray(0)
  private var segmentCiphertextLengthsBytes: IntArray = IntArray(0)
  private var aesKeyBytes: ByteArray = ByteArray(0)

  private var readPositionBytes: Long = 0
  private var remainingBytes: Long = C.LENGTH_UNSET.toLong()

  private var currentSegmentIndex = -1
  private var currentSegmentPlaintext: ByteArray? = null

  private val maximumCachedSegments = 12
  private val segmentPlaintextCache = object : LinkedHashMap<Int, ByteArray>(maximumCachedSegments, 0.75f, true) {
    override fun removeEldestEntry(eldest: MutableMap.MutableEntry<Int, ByteArray>): Boolean {
      return size > maximumCachedSegments
    }
  }

  override fun addTransferListener(transferListener: TransferListener) {}

  @Throws(IOException::class)
  private fun readFully(inputStream: FileInputStream, buffer: ByteArray, offset: Int, length: Int, label: String) {
    var totalRead = 0
    while (totalRead < length) {
      val readNow = inputStream.read(buffer, offset + totalRead, length - totalRead)
      if (readNow <= 0) {
        val position = try {
          inputStream.channel.position()
        } catch (e: Exception) {
          -1
        }
        Log.e(tag, "short_read label=$label position=$position need=${length - totalRead} length=$length")
        throw EOFException("short read")
      }
      totalRead += readNow
    }
  }

  private fun validateAesKey(keyBytes: ByteArray) {
    if (!(keyBytes.size == 16 || keyBytes.size == 24 || keyBytes.size == 32)) {
      throw IOException("invalid AES key length")
    }
  }

  override fun open(dataSpec: DataSpec): Long {
    if (isOpen) throw IOException("already open")
    dataUri = dataSpec.uri
    val token = dataUri?.host ?: dataUri?.lastPathSegment ?: throw IOException("missing token")
    val entry = SegmentedRegistry.get(token) ?: throw IOException("no registry entry for token")
    aesKeyBytes = entry.key
    validateAesKey(aesKeyBytes)
    val filePath = entry.path
    sourceFile = File(filePath)
    if (sourceFile?.exists() != true) throw IOException("file not found: $filePath")
    parseHeaderAndIndex()
    val encryptedFileLengthBytes = sourceFile?.length() ?: -1
    Log.d(tag, "open: segmentCount=$segmentCount segmentSizeBytes=$segmentSizeBytes plainTextLengthBytes=$plainTextLengthBytes encryptedFileLengthBytes=$encryptedFileLengthBytes")
    readPositionBytes = dataSpec.position
    remainingBytes = if (dataSpec.length == C.LENGTH_UNSET.toLong()) {
      plainTextLengthBytes - readPositionBytes
    } else {
      dataSpec.length
    }
    isOpen = true
    return if (remainingBytes == C.LENGTH_UNSET.toLong()) C.LENGTH_UNSET.toLong() else remainingBytes
  }

  override fun read(buffer: ByteArray, offset: Int, readLength: Int): Int {
    if (!isOpen) throw IOException("not open")
    if (remainingBytes == 0L) return C.RESULT_END_OF_INPUT
    val allowedReadBytes = if (remainingBytes == C.LENGTH_UNSET.toLong()) readLength else min(readLength.toLong(), remainingBytes).toInt()
    var total = 0
    while (total < allowedReadBytes) {
      if (readPositionBytes >= segmentSizeBytes.toLong() * segmentCount) {
        return if (total == 0) C.RESULT_END_OF_INPUT else total
      }
      val segmentIndex = (readPositionBytes / segmentSizeBytes).toInt()
      val withinSegmentOffsetBytes = (readPositionBytes % segmentSizeBytes).toInt()
      ensureSegmentPlaintextLoaded(segmentIndex)
      val plaintext = currentSegmentPlaintext ?: return if (total == 0) C.RESULT_END_OF_INPUT else total
      val copyBytes = min(allowedReadBytes - total, plaintext.size - withinSegmentOffsetBytes)
      System.arraycopy(plaintext, withinSegmentOffsetBytes, buffer, offset + total, copyBytes)
      total += copyBytes
      readPositionBytes += copyBytes
      if (remainingBytes != C.LENGTH_UNSET.toLong()) {
        remainingBytes -= copyBytes.toLong()
        if (remainingBytes == 0L) break
      }
    }
    return total
  }

  override fun getUri(): Uri? = dataUri

  override fun close() {
    currentSegmentPlaintext = null
    currentSegmentIndex = -1
    segmentPlaintextCache.clear()
    isOpen = false
    dataUri = null
    sourceFile = null
  }

  @Throws(IOException::class)
  private fun parseHeaderAndIndex() {
    val file = sourceFile ?: throw IOException("no file")
    val encryptedFileLengthBytes = file.length()
    FileInputStream(file).use { headerStream ->
      val headerBytes = ByteArray(fileHeaderSizeBytes)
      readFully(headerStream, headerBytes, 0, headerBytes.size, "header")
      val headerBuffer = ByteBuffer.wrap(headerBytes).order(ByteOrder.BIG_ENDIAN)
      val magicBytes = ByteArray(4)
      headerBuffer.get(magicBytes)
      val magicString = String(magicBytes, Charsets.US_ASCII)
      if (magicString != "CSG1") throw IOException("bad magic")
      val version = headerBuffer.int
      if (version != 2) throw IOException("unsupported version")
      val cipherCode = headerBuffer.int
      if (cipherCode != 1) throw IOException("unsupported cipher")
      segmentSizeBytes = headerBuffer.int
      plainTextLengthBytes = headerBuffer.long
      segmentCount = headerBuffer.int
      headerByteCount = headerBytes.size
      fileHeaderBytes = headerBytes
    }

    if (segmentSizeBytes <= 0 || segmentSizeBytes > maximumSegmentSizeBytes) throw IOException("invalid segment size")
    if (plainTextLengthBytes < 0L) throw IOException("invalid plaintext length")
    if (segmentCount < 0) throw IOException("invalid segment count")

    val expectedSegmentCount = if (plainTextLengthBytes == 0L) 0 else ((plainTextLengthBytes + segmentSizeBytes - 1) / segmentSizeBytes).toInt()
    if (segmentCount != expectedSegmentCount) throw IOException("segment count mismatch")

    val minimumEncryptedFileLengthBytes = headerByteCount.toLong() + segmentCount.toLong() * segmentHeaderSizeBytes.toLong()
    if (encryptedFileLengthBytes < minimumEncryptedFileLengthBytes) throw IOException("file too small")

    segmentCiphertextOffsetsBytes = LongArray(segmentCount)
    segmentCiphertextLengthsBytes = IntArray(segmentCount)

    FileInputStream(file).use { indexStream ->
      var offsetBytes = headerByteCount.toLong()
      val segmentHeaderBytes = ByteArray(segmentHeaderSizeBytes)
      for (index in 0 until segmentCount) {
        if (offsetBytes + segmentHeaderSizeBytes > encryptedFileLengthBytes) throw IOException("segment header out of bounds")
        indexStream.channel.position(offsetBytes)
        readFully(indexStream, segmentHeaderBytes, 0, segmentHeaderBytes.size, "segment_header[$index]")
        val ciphertextLengthBytes = ByteBuffer.wrap(segmentHeaderBytes, 12, 4).order(ByteOrder.BIG_ENDIAN).int
        if (ciphertextLengthBytes < aesGcmTagSizeBytes) throw IOException("invalid ciphertext length")
        if (ciphertextLengthBytes > segmentSizeBytes + aesGcmTagSizeBytes) throw IOException("invalid ciphertext length")
        val ciphertextStartBytes = offsetBytes + segmentHeaderSizeBytes
        val ciphertextEndBytes = ciphertextStartBytes + ciphertextLengthBytes.toLong()
        if (ciphertextEndBytes > encryptedFileLengthBytes) throw IOException("segment ciphertext out of bounds")
        segmentCiphertextOffsetsBytes[index] = ciphertextStartBytes
        segmentCiphertextLengthsBytes[index] = ciphertextLengthBytes
        offsetBytes = ciphertextEndBytes
      }
    }
  }

  @Throws(IOException::class)
  private fun ensureSegmentPlaintextLoaded(index: Int) {
    if (index == currentSegmentIndex) return
    if (index < 0 || index >= segmentCount) throw IOException("segment index out of range")

    val cached = segmentPlaintextCache[index]
    if (cached != null) {
      currentSegmentPlaintext = cached
      currentSegmentIndex = index
      return
    }

    val file = sourceFile ?: throw IOException("no file")
    val ciphertextOffsetBytes = segmentCiphertextOffsetsBytes[index]
    val ciphertextLengthBytes = segmentCiphertextLengthsBytes[index]
    val segmentHeaderOffsetBytes = ciphertextOffsetBytes - segmentHeaderSizeBytes.toLong()

    FileInputStream(file).use { inputStream ->
      inputStream.channel.position(segmentHeaderOffsetBytes)
      val headerBytes = ByteArray(segmentHeaderSizeBytes)
      readFully(inputStream, headerBytes, 0, headerBytes.size, "segment_header_read[$index]")
      val nonceBytes = headerBytes.copyOfRange(0, 12)
      val ciphertextBytes = ByteArray(ciphertextLengthBytes)
      readFully(inputStream, ciphertextBytes, 0, ciphertextBytes.size, "segment_ciphertext_read[$index]")

      val cipher = Cipher.getInstance("AES/GCM/NoPadding")
      cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(aesKeyBytes, "AES"), GCMParameterSpec(128, nonceBytes))
      cipher.updateAAD(fileHeaderBytes)
      val segmentIndexBytes = ByteBuffer.allocate(4).order(ByteOrder.BIG_ENDIAN).putInt(index).array()
      cipher.updateAAD(segmentIndexBytes)
      val plaintextBytes = try {
        cipher.doFinal(ciphertextBytes)
      } catch (e: Exception) {
        Log.e(tag, "decrypt_fail index=$index err=${e.javaClass.simpleName}:${e.message}")
        throw IOException("segment decrypt failed")
      }

      val expectedPlaintextLengthBytes = if (index == segmentCount - 1) {
        val fullSegmentsBytes = (segmentCount - 1).toLong() * segmentSizeBytes.toLong()
        (plainTextLengthBytes - fullSegmentsBytes).toInt()
      } else {
        segmentSizeBytes
      }
      if (plaintextBytes.size != expectedPlaintextLengthBytes) throw IOException("segment plaintext length mismatch")
      currentSegmentPlaintext = plaintextBytes
      currentSegmentIndex = index
      segmentPlaintextCache[index] = plaintextBytes
    }
  }

  class Factory : DataSource.Factory {
    override fun createDataSource(): DataSource = SegmentedDataSource()
  }
}

