import { readMeetingRecordingById, updateMeetingRecording } from "./store"

export async function stopMeetingRecording(params: {
  userId: string
  id: string
  endedAtUnixMs: number
  stopReason: string
}): Promise<{ ok: true; alreadyStopped: boolean }> {
  const existing = await readMeetingRecordingById({ userId: params.userId, id: params.id })
  if (!existing) {
    throw new Error("Meeting recording not found")
  }

  if (
    existing.status === "completed" ||
    existing.status === "failed" ||
    existing.status === "cancelled" ||
    existing.status === "interrupted"
  ) {
    return { ok: true, alreadyStopped: true }
  }

  await updateMeetingRecording({
    userId: params.userId,
    id: params.id,
    status: "stopping",
    endedAtUnixMs: params.endedAtUnixMs,
    stopReason: params.stopReason,
    updatedAtUnixMs: Date.now(),
  })

  return { ok: true, alreadyStopped: false }
}
