import { decryptPipedriveSecret } from "./decryptPipedriveSecret"
import { applyPipedriveImportMappings } from "./applyPipedriveImportMappings"
import { fetchPipedriveActivities } from "./fetchPipedriveActivities"
import { fetchPipedriveFiles } from "./fetchPipedriveFiles"
import { fetchPipedriveNotes } from "./fetchPipedriveNotes"
import { fetchPipedriveOrganizations } from "./fetchPipedriveOrganizations"
import { fetchPipedrivePersons } from "./fetchPipedrivePersons"
import { readPipedriveConnection, type PipedriveImportJob, updatePipedriveImportJob } from "./store"
import { storePipedriveRawEntity } from "./storePipedriveRawEntity"

const DEFAULT_ENTITY_TYPES = ["persons", "organizations", "activities", "notes", "files"]

function readExternalId(entity: unknown): string | null {
  const value = entity && typeof entity === "object" ? (entity as any).id : null
  const id = String(value || "").trim()
  return id || null
}

async function fetchEntitiesByType(params: { entityType: string; accessToken: string }): Promise<unknown[]> {
  if (params.entityType === "persons") return fetchPipedrivePersons({ accessToken: params.accessToken })
  if (params.entityType === "organizations") return fetchPipedriveOrganizations({ accessToken: params.accessToken })
  if (params.entityType === "activities") return fetchPipedriveActivities({ accessToken: params.accessToken })
  if (params.entityType === "notes") return fetchPipedriveNotes({ accessToken: params.accessToken })
  if (params.entityType === "files") return fetchPipedriveFiles({ accessToken: params.accessToken })
  return []
}

export async function runPipedriveImportJob(job: PipedriveImportJob): Promise<void> {
  const warnings: string[] = []
  try {
    const connection = await readPipedriveConnection({ userId: job.userId, connectionId: job.connectionId })
    if (!connection || connection.status !== "active") {
      throw new Error("Pipedrive connection not found")
    }

    const accessToken = await decryptPipedriveSecret(connection.accessTokenEncrypted)
    const entityTypes = job.entityTypes.length ? job.entityTypes : DEFAULT_ENTITY_TYPES
    const progress: Record<string, unknown> = {}

    for (const entityType of entityTypes) {
      const entities = await fetchEntitiesByType({ entityType, accessToken })
      let storedCount = 0
      for (const entity of entities) {
        const externalId = readExternalId(entity)
        if (!externalId) {
          warnings.push(`Skipped ${entityType} item without id`)
          continue
        }
        await storePipedriveRawEntity({
          jobId: job.id,
          userId: job.userId,
          entityType,
          externalId,
          payload: entity,
        })
        storedCount += 1
      }
      progress[entityType] = { fetchedCount: entities.length, storedCount }
      await updatePipedriveImportJob({ jobId: job.id, status: "fetching", progress, warnings })
    }

    await updatePipedriveImportJob({ jobId: job.id, status: "mapping", progress, warnings })
    const mappingResult = await applyPipedriveImportMappings({ userId: job.userId, jobId: job.id })
    progress.mapping = mappingResult

    await updatePipedriveImportJob({
      jobId: job.id,
      status: "completed",
      progress,
      warnings,
      completedAtUnixMs: Date.now(),
      errorMessage: null,
    })
  } catch (error: any) {
    await updatePipedriveImportJob({
      jobId: job.id,
      status: "failed",
      errorMessage: String(error?.message || error),
      completedAtUnixMs: Date.now(),
    })
  }
}
