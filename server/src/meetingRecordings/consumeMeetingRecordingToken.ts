import { consumeMeetingRecordingToken as consumeMeetingRecordingTokenInStore } from "./store"

export async function consumeMeetingRecordingToken(params: {
  userId: string
  token: string
  meetingRecordingId: string
}): Promise<boolean> {
  return consumeMeetingRecordingTokenInStore(params)
}
