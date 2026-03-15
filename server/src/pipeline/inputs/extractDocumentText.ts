import { normalizeText } from "../../ai/shared/normalize"

export type DocumentExtractionResult = {
  extractedText: string
  detectedType: "pdf" | "docx"
}

function readDocumentType(params: { fileName: string; mimeType: string }): "pdf" | "docx" | null {
  const fileName = String(params.fileName || "").toLowerCase()
  const mimeType = String(params.mimeType || "").toLowerCase()
  if (mimeType.includes("application/pdf") || fileName.endsWith(".pdf")) return "pdf"
  if (
    mimeType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||
    fileName.endsWith(".docx")
  ) {
    return "docx"
  }
  return null
}

export function isSupportedDocumentType(params: { fileName: string; mimeType: string }): boolean {
  return readDocumentType(params) !== null
}

export async function extractDocumentText(params: {
  fileName: string
  mimeType: string
  base64Content: string
}): Promise<DocumentExtractionResult> {
  const detectedType = readDocumentType({ fileName: params.fileName, mimeType: params.mimeType })
  if (!detectedType) {
    throw new Error("Alleen PDF en DOCX worden ondersteund in deze fase.")
  }

  const binary = Buffer.from(String(params.base64Content || ""), "base64")
  if (binary.length === 0) {
    throw new Error("Leeg document ontvangen.")
  }

  if (detectedType === "pdf") {
    const pdfParse = (await import("pdf-parse")).default
    const parsed = await pdfParse(binary)
    const extractedText = normalizeText(parsed?.text)
    if (!extractedText) throw new Error("Geen leesbare tekst gevonden in het PDF-document.")
    return { extractedText, detectedType: "pdf" }
  }

  const mammoth = await import("mammoth")
  const parsed = await mammoth.extractRawText({ buffer: binary })
  const extractedText = normalizeText(parsed?.value)
  if (!extractedText) throw new Error("Geen leesbare tekst gevonden in het DOCX-document.")
  return { extractedText, detectedType: "docx" }
}

