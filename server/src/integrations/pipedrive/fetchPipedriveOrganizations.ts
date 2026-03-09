import { fetchAllPipedriveEntities } from "./fetchPipedriveEntities"

export async function fetchPipedriveOrganizations(params: { accessToken: string }): Promise<unknown[]> {
  return fetchAllPipedriveEntities({ accessToken: params.accessToken, endpointPath: "organizations" })
}
