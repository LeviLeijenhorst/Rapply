import { createMeetingRecordingToken as createMeetingRecordingTokenInStore } from "./store"

export async function createMeetingRecordingToken(params: {
  userId: string
  meetingRecordingId: string
  expiresAtIso: string
}): Promise<{ token: string }> {
  return createMeetingRecordingTokenInStore(params)
}
