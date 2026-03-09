import { upsertPipedriveRawEntity } from "./store"

export async function storePipedriveRawEntity(params: {
  jobId: string
  userId: string
  entityType: string
  externalId: string
  payload: unknown
}): Promise<void> {
  await upsertPipedriveRawEntity(params)
}
