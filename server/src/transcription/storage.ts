import { createUploadUrl, getTranscriptionUploadsContainerClient } from "../azureBlob"

// Intent: createEncryptedUploadUrl
export async function createEncryptedUploadUrl(params: { blobName: string; expiresInSeconds: number }) {
  return await createUploadUrl({ blobName: params.blobName, expiresInSeconds: params.expiresInSeconds })
}

// Intent: fetchEncryptedUploadStream
export async function fetchEncryptedUploadStream(params: { blobName: string }): Promise<NodeJS.ReadableStream> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(params.blobName.replace(/^\/+/, ""))
  const download = await blob.download()
  const stream = download.readableStreamBody
  if (!stream) {
    throw new Error("Upload not found")
  }
  return stream as any
}

// Intent: deleteEncryptedUpload
export async function deleteEncryptedUpload(params: { blobName: string }): Promise<void> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(params.blobName.replace(/^\/+/, ""))
  await blob.deleteIfExists()
}

// Intent: getEncryptedUploadSize
export async function getEncryptedUploadSize(params: { blobName: string }): Promise<number> {
  const container = getTranscriptionUploadsContainerClient()
  const blob = container.getBlobClient(params.blobName.replace(/^\/+/, ""))
  const properties = await blob.getProperties()
  return typeof properties.contentLength === "number" ? properties.contentLength : 0
}

// Intent: deleteEncryptedUploadsByPrefix
export async function deleteEncryptedUploadsByPrefix(params: { prefix: string }): Promise<void> {
  const container = getTranscriptionUploadsContainerClient()
  const prefix = String(params.prefix || "").trim().replace(/^\/+/, "")
  if (!prefix || !prefix.endsWith("/")) {
    throw new Error("Invalid deletion prefix")
  }
  for await (const item of container.listBlobsFlat({ prefix })) {
    const name = String(item?.name || "").trim()
    if (!name) continue
    await container.deleteBlob(name)
  }
}

