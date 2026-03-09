import { readPipedriveImportJob as readPipedriveImportJobInStore } from "./store"

export async function readPipedriveImportJob(params: { userId: string; jobId: string }) {
  return readPipedriveImportJobInStore(params)
}
