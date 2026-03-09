import { createClient } from "../../clients/store"
import { mapPipedrivePersonToClient } from "./mapPipedrivePersonToClient"
import { listPipedriveRawEntities, readExternalSourceLink, upsertExternalSourceLink } from "./store"

export async function applyPipedriveImportMappings(params: {
  userId: string
  jobId: string
}): Promise<{ clientsCreated: number }> {
  let clientsCreated = 0
  const personEntities = await listPipedriveRawEntities({ jobId: params.jobId, entityType: "persons" })
  for (const entity of personEntities) {
    const link = await readExternalSourceLink({
      userId: params.userId,
      provider: "pipedrive",
      externalType: "person",
      externalId: entity.externalId,
    })
    if (link) continue

    const mapped = mapPipedrivePersonToClient({ payload: entity.payload, nowUnixMs: Date.now() })
    if (!mapped) continue

    await createClient(params.userId, mapped.client)
    await upsertExternalSourceLink({
      userId: params.userId,
      provider: "pipedrive",
      externalType: "person",
      externalId: mapped.externalId,
      internalType: "client",
      internalId: mapped.client.id,
      sourceJobId: params.jobId,
    })
    clientsCreated += 1
  }

  return { clientsCreated }
}
