import { detectActivitiesFromTranscript, type DetectedActivitySuggestion } from '../services/activityDetection'
import { aiEditSnippetText, aiOverwriteSnippetText, extractSnippetsForItem } from '../services/snippetExtraction'

export type { DetectedActivitySuggestion }

export { aiEditSnippetText, aiOverwriteSnippetText, detectActivitiesFromTranscript, extractSnippetsForItem }
