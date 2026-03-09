export async function transcribeWrittenRecap(text: string): Promise<string> {
  return String(text || '').trim()
}
