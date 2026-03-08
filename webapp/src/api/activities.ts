import { detectActivitiesFromTranscript, type DetectedActivitySuggestion } from '../api/activityDetection'
import { aiEditSnippetText, aiOverwriteSnippetText, extractSnippetsForItem } from '../api/snippetExtraction'

export type { DetectedActivitySuggestion }

export { aiEditSnippetText, aiOverwriteSnippetText, detectActivitiesFromTranscript, extractSnippetsForItem }
