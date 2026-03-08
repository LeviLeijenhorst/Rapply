import { createSessionRemote, deleteSessionRemote, updateSessionRemote } from '../appData'

export const sessionApi = {
  create: createSessionRemote,
  update: updateSessionRemote,
  delete: deleteSessionRemote,
}
