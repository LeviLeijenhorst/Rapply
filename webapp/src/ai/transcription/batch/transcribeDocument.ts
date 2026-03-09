export async function transcribeDocument(text: string): Promise<string> {
  return String(text || '').trim()
}
