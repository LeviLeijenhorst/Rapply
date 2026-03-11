import { createUploadUrl, getTranscriptionUploadsContainerClient } from "../azureBlob"

// Normalizes blob names before they are passed to Azure Storage.
function normalizeBlobName(blobName: string): string {
  return String(blobName || "").replace(/^\/+/, "")
}

// Creates a signed upload target for one encrypted transcription payload.
export async function createEncryptedUploadUrl(params: { blobName: string; expiresInSeconds: number }) {
  return await createUploadUrl({ blobName: params.blobName, expiresInSeconds: params.expiresInSeconds })
}

// Downloads one encrypted upload as a stream.
export async function fetchEncryptedUploadStream(params: { blobName: string }): Promise<NodeJS.ReadableStream> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(normalizeBlobName(params.blobName))
  const download = await blob.download()
  const stream = download.readableStreamBody
  if (!stream) {
    throw new Error("Upload not found")
  }
  return stream as any
}

// Deletes one encrypted upload.
export async function deleteEncryptedUpload(params: { blobName: string }): Promise<void> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(normalizeBlobName(params.blobName))
  await blob.deleteIfExists()
}

// Reads the byte size for one encrypted upload.
export async function getEncryptedUploadSize(params: { blobName: string }): Promise<number> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(normalizeBlobName(params.blobName))
  const properties = await blob.getProperties()
  return typeof properties.contentLength === "number" ? properties.contentLength : 0
}

// Deletes every encrypted upload stored under one prefix.
export async function deleteEncryptedUploadsByPrefix(params: { prefix: string }): Promise<void> {
  const container = getTranscriptionUploadsContainerClient()
  const normalizedPrefix = normalizeBlobName(String(params.prefix || "").trim())
  if (!normalizedPrefix || !normalizedPrefix.endsWith("/")) {
    throw new Error("Invalid deletion prefix")
  }
  for await (const item of container.listBlobsFlat({ prefix: normalizedPrefix })) {
    const name = String(item?.name || "").trim()
    if (!name) continue
    await container.deleteBlob(name)
  }
}

