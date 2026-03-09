import { claimNextQueuedPipedriveImportJob } from "./store"

export async function claimNextPipedriveImportJob() {
  return claimNextQueuedPipedriveImportJob()
}
