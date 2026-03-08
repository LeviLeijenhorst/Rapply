import type { SessionKind } from '../storage/types'

// Session currently stores multiple dossier artifact types in one table.
// The kind field is the contract that distinguishes artifact behavior.
export const SESSION_ARTIFACT_KINDS: readonly SessionKind[] = ['recording', 'upload', 'written', 'notes', 'intake']

export function isSessionReportArtifact(session: { kind: string }): boolean {
  return session.kind === 'written'
}

export function isSessionNotesArtifact(session: { kind: string }): boolean {
  return session.kind === 'notes'
}

export function isSessionConversationArtifact(session: { kind: string }): boolean {
  return session.kind === 'recording' || session.kind === 'upload'
}

export function isSessionPrimaryInputArtifact(session: { kind: string }): boolean {
  return session.kind === 'recording' || session.kind === 'upload' || session.kind === 'intake'
}
