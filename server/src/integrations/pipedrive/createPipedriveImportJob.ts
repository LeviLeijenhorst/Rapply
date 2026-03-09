import { createPipedriveImportJob as createPipedriveImportJobInStore, readPipedriveConnection } from "./store"

export async function createPipedriveImportJob(params: {
  userId: string
  connectionId: string
  entityTypes: string[]
  mappingVersion: string
  options: Record<string, unknown> | null
}): Promise<{ jobId: string }> {
  const connection = await readPipedriveConnection({ userId: params.userId, connectionId: params.connectionId })
  if (!connection || connection.status !== "active") {
    throw new Error("Pipedrive connection not found")
  }
  return createPipedriveImportJobInStore(params)
}
