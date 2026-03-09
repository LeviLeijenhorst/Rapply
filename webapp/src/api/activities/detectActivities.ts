import { callSecureApi } from '../core/secureApi'

export type DetectedActivitySuggestion = {
  templateId?: string
  name: string
  category: string
  suggestedHours: number
  confidence: number
  rationale: string
}

type DetectActivitiesResponse = {
  suggestions?: DetectedActivitySuggestion[]
}

export async function detectActivitiesFromTranscript(params: {
  itemId: string
  trajectoryId: string
  transcript: string
}): Promise<DetectedActivitySuggestion[]> {
  const response = await callSecureApi<DetectActivitiesResponse>('/activities/detect', {
    itemId: params.itemId,
    trajectoryId: params.trajectoryId,
    transcript: params.transcript,
  })
  return Array.isArray(response?.suggestions) ? response.suggestions : []
}


