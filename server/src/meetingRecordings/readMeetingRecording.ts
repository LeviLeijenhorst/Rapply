import { readMeetingRecordingById } from "./store"

export async function readMeetingRecording(params: { userId: string; id: string }) {
  return readMeetingRecordingById(params)
}
