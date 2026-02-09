import { BlobSASPermissions, BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters } from "@azure/storage-blob"
import { env } from "./env"

const credential = new StorageSharedKeyCredential(env.azureStorageAccountName, env.azureStorageAccountKey)
const serviceClient = new BlobServiceClient(`https://${env.azureStorageAccountName}.blob.core.windows.net`, credential)

export function getTranscriptionUploadsContainerClient() {
  return serviceClient.getContainerClient(env.azureStorageTranscriptionUploadsContainer)
}

function encodePathPreservingSlashes(value: string): string {
  return String(value || "")
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")
}

export async function createUploadUrl(params: { blobName: string; expiresInSeconds: number }): Promise<{ uploadUrl: string; uploadHeaders: Record<string, string> }> {
  const containerName = env.azureStorageTranscriptionUploadsContainer
  const blobName = params.blobName.replace(/^\/+/, "")
  const expiresOn = new Date(Date.now() + Math.max(1, params.expiresInSeconds) * 1000)

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      expiresOn,
      permissions: BlobSASPermissions.parse("cw"),
      contentType: "application/octet-stream",
    },
    credential,
  ).toString()

  const uploadUrl = `https://${env.azureStorageAccountName}.blob.core.windows.net/${encodeURIComponent(containerName)}/${encodePathPreservingSlashes(blobName)}?${sas}`

  return {
    uploadUrl,
    uploadHeaders: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": "application/octet-stream",
    },
  }
}
