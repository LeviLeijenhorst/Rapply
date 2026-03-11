import type { InputKind } from '../storage/types'

export const SESSION_ARTIFACT_KINDS: readonly InputKind[] = ['recording', 'upload', 'written', 'notes', 'intake']

export function isInputReportArtifact(session: { kind: string }): boolean {
  return session.kind === 'written'
}

export function isInputNotesArtifact(session: { kind: string }): boolean {
  return session.kind === 'notes'
}

export function isInputConversationArtifact(session: { kind: string }): boolean {
  return session.kind === 'recording' || session.kind === 'upload'
}

export function isInputPrimaryInputArtifact(session: { kind: string }): boolean {
  return session.kind === 'recording' || session.kind === 'upload' || session.kind === 'intake'
}

// Temporary aliases while the report flow is still migrating.
export const isSessionReportArtifact = isInputReportArtifact
export const isSessionNotesArtifact = isInputNotesArtifact
export const isSessionPrimaryInputArtifact = isInputPrimaryInputArtifact
