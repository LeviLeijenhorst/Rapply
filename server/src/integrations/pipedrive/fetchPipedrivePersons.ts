import { fetchAllPipedriveEntities } from "./fetchPipedriveEntities"

export async function fetchPipedrivePersons(params: { accessToken: string }): Promise<unknown[]> {
  return fetchAllPipedriveEntities({ accessToken: params.accessToken, endpointPath: "persons" })
}
