import { readPipedriveConnection as readPipedriveConnectionInStore } from "./store"

export async function readPipedriveConnection(params: { userId: string; connectionId: string }) {
  return readPipedriveConnectionInStore(params)
}
