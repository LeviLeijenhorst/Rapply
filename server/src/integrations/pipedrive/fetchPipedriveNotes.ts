import { fetchAllPipedriveEntities } from "./fetchPipedriveEntities"

export async function fetchPipedriveNotes(params: { accessToken: string }): Promise<unknown[]> {
  return fetchAllPipedriveEntities({ accessToken: params.accessToken, endpointPath: "notes" })
}
