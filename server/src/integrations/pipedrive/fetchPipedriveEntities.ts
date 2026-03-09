import { env } from "../../env"

type PipedrivePagination = {
  more_items_in_collection?: boolean
  next_start?: number
}

type PipedriveListResponse = {
  data?: unknown[]
  additional_data?: {
    pagination?: PipedrivePagination
  }
}

async function fetchEntityPage(params: {
  accessToken: string
  endpointPath: string
  start: number
  limit: number
}): Promise<{ items: unknown[]; nextStart: number | null }> {
  const url = new URL(`${env.pipedriveApiBaseUrl.replace(/\/+$/g, "")}/${params.endpointPath.replace(/^\/+/, "")}`)
  url.searchParams.set("start", String(params.start))
  url.searchParams.set("limit", String(params.limit))

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: "application/json",
    },
  })
  const payload = (await response.json().catch(() => null)) as PipedriveListResponse | null
  if (!response.ok) {
    throw new Error(`Pipedrive fetch failed (${response.status}) for ${params.endpointPath}`)
  }

  const items = Array.isArray(payload?.data) ? payload!.data! : []
  const pagination = payload?.additional_data?.pagination
  const more = Boolean(pagination?.more_items_in_collection)
  const nextStart = more ? Number(pagination?.next_start ?? NaN) : NaN
  return { items, nextStart: Number.isFinite(nextStart) ? nextStart : null }
}

export async function fetchAllPipedriveEntities(params: {
  accessToken: string
  endpointPath: string
  pageSize?: number
}): Promise<unknown[]> {
  const pageSize = Math.max(1, Math.min(500, Number(params.pageSize || 200)))
  const items: unknown[] = []
  let start = 0
  for (let page = 0; page < 1000; page += 1) {
    const result = await fetchEntityPage({
      accessToken: params.accessToken,
      endpointPath: params.endpointPath,
      start,
      limit: pageSize,
    })
    items.push(...result.items)
    if (result.nextStart === null) break
    start = result.nextStart
  }
  return items
}
