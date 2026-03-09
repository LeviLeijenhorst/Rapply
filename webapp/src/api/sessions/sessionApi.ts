import { createSessionRemote, deleteSessionRemote, updateSessionRemote } from '../appData/appDataApi'

export const sessionApi = {
  create: createSessionRemote,
  update: updateSessionRemote,
  delete: deleteSessionRemote,
}
