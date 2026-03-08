export async function transcribeWrittenInput(text: string): Promise<string> {
  return String(text || '').trim()
}
