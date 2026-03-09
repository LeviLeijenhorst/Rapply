import { fetchAllPipedriveEntities } from "./fetchPipedriveEntities"

export async function fetchPipedriveActivities(params: { accessToken: string }): Promise<unknown[]> {
  return fetchAllPipedriveEntities({ accessToken: params.accessToken, endpointPath: "activities" })
}
