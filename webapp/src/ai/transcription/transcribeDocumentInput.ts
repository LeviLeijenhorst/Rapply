export async function transcribeDocumentInput(text: string): Promise<string> {
  return String(text || '').trim()
}
