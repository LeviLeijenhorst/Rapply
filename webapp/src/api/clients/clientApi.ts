import { createCoacheeRemote, deleteCoacheeRemote, updateCoacheeRemote } from '../appData'

export const clientApi = {
  create: createCoacheeRemote,
  update: updateCoacheeRemote,
  delete: deleteCoacheeRemote,
}
