import { postToSecureApi } from "./secureApi"

export async function generateSummaryFromTranscript(transcript: string): Promise<string> {
  if (typeof transcript !== "string" || !transcript.trim()) {
    throw new Error("Missing transcript")
  }
  const json = await postToSecureApi("/summary", { transcript })
  const summary = json?.summary
  if (typeof summary !== "string" || !summary.trim()) {
    throw new Error("Summary generation failed")
  }
  return summary.trim()
}

