import { fetchAllPipedriveEntities } from "./fetchPipedriveEntities"

export async function fetchPipedriveFiles(params: { accessToken: string }): Promise<unknown[]> {
  return fetchAllPipedriveEntities({ accessToken: params.accessToken, endpointPath: "files" })
}
