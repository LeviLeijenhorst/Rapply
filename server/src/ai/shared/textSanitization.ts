export function stripJsonCodeFences(value: string): string {
  const trimmed = String(value || "").trim()
  if (!trimmed.startsWith("```")) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

export function removeSpeakerLabelsFromOutput(value: string): string {
  return String(value || "")
    .replace(/\bspeaker[_\s-]*\d+\b\s*:?\s*/gi, "")
    .replace(/\bspreker[_\s-]*\d+\b\s*:?\s*/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}
