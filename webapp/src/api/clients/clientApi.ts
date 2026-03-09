import { createCoacheeRemote, deleteCoacheeRemote, updateCoacheeRemote } from '../appData/appDataApi'

export const clientApi = {
  create: createCoacheeRemote,
  update: updateCoacheeRemote,
  delete: deleteCoacheeRemote,
}
