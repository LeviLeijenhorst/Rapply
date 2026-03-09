import { updateSession } from "../sessions/store"
import { readMeetingRecordingById, updateMeetingRecording } from "./store"

export async function cancelMeetingRecording(params: { userId: string; id: string }): Promise<{ ok: true; alreadyCancelled: boolean }> {
  const existing = await readMeetingRecordingById({ userId: params.userId, id: params.id })
  if (!existing) {
    throw new Error("Meeting recording not found")
  }

  if (existing.status === "cancelled") {
    return { ok: true, alreadyCancelled: true }
  }

  await updateMeetingRecording({
    userId: params.userId,
    id: params.id,
    status: "cancelled",
    endedAtUnixMs: Date.now(),
    stopReason: "user_cancel",
    updatedAtUnixMs: Date.now(),
  })

  await updateSession(params.userId, {
    id: existing.sessionId,
    transcriptionStatus: "error",
    transcriptionError: "Recording cancelled",
    updatedAtUnixMs: Date.now(),
  })

  return { ok: true, alreadyCancelled: false }
}
