import { env } from "../../env"
import { normalizeText } from "../../ai/shared/normalize"

export type DocumentExtractionResult = {
  extractedText: string
  detectedType: "pdf" | "docx" | "doc"
  suggestedTitle: string
}

function readDocumentType(params: { fileName: string; mimeType: string }): "pdf" | "docx" | "doc" | null {
  const fileName = String(params.fileName || "").toLowerCase()
  const mimeType = String(params.mimeType || "").toLowerCase()
  if (mimeType.includes("application/pdf") || fileName.endsWith(".pdf")) return "pdf"
  if (mimeType.includes("application/msword") || fileName.endsWith(".doc")) return "doc"
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

function readFileNameBase(fileName: string): string {
  const normalized = String(fileName || "").replace(/\\/g, "/")
  const baseName = normalized.split("/").pop() || ""
  return normalizeText(baseName.replace(/\.[^.]+$/, ""))
}

function normalizeDocumentText(value: unknown): string {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function decodeUtf16LePrintable(binary: Buffer): string {
  const chars: string[] = []
  for (let index = 0; index + 1 < binary.length; index += 2) {
    const code = binary.readUInt16LE(index)
    if (code === 9 || code === 10 || code === 13) {
      chars.push(code === 9 ? "\t" : "\n")
      continue
    }
    if (code >= 32 && code <= 0xfffd) chars.push(String.fromCharCode(code))
  }
  return chars.join("")
}

function extractPrintableRuns(text: string): string[] {
  return String(text || "")
    .split(/[^A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF@&()\[\]{}:;,.!?'"%+\-\/\\=\n\t ]+/)
    .map((part) => part.replace(/[ \t]+\n/g, "\n").trim())
    .filter((part) => part.length >= 3)
}

function extractLegacyDocText(binary: Buffer): string {
  const asciiRuns = extractPrintableRuns(binary.toString("latin1"))
  const utf16Runs = extractPrintableRuns(decodeUtf16LePrintable(binary))
  const merged = [...asciiRuns, ...utf16Runs]
  const deduped = merged.filter((part, index) => merged.indexOf(part) === index)
  return normalizeDocumentText(deduped.join("\n"))
}

function decodeXmlEntities(value: string): string {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}

async function extractDocxTextWithJsZip(binary: Buffer): Promise<{ extractedText: string; metadataTitle: string }> {
  const JSZip = (await import("jszip")).default
  const archive = await JSZip.loadAsync(binary)
  const candidatePaths = Object.keys(archive.files).filter((path) =>
    /^(word\/document\.xml|word\/header\d+\.xml|word\/footer\d+\.xml|word\/footnotes\.xml|word\/endnotes\.xml)$/i.test(path),
  )

  const xmlParts = await Promise.all(
    candidatePaths.map(async (path) => {
      const file = archive.file(path)
      return file ? file.async("string") : ""
    }),
  )

  const extractedText = normalizeDocumentText(
    xmlParts
      .map((xml) =>
        decodeXmlEntities(
          String(xml || "")
            .replace(/<w:tab\b[^/]*\/>/gi, "\t")
            .replace(/<w:(?:br|cr)\b[^/]*\/>/gi, "\n")
            .replace(/<\/w:p>/gi, "\n")
            .replace(/<\/w:tr>/gi, "\n")
            .replace(/<[^>]+>/g, ""),
        ),
      )
      .join("\n"),
  )

  const coreXml = await archive.file("docProps/core.xml")?.async("string")
  const metadataTitle = decodeXmlEntities(String(coreXml || "").match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1] || "")

  return { extractedText, metadataTitle: normalizeText(metadataTitle) }
}

function readCandidateTitleFromText(extractedText: string): string {
  const lines = String(extractedText || "")
    .split("\n")
    .map((line) => normalizeText(line))
    .filter(Boolean)

  for (const line of lines.slice(0, 8)) {
    if (line.length < 3 || line.length > 140) continue
    if (/[.!?]$/.test(line) && line.split(/\s+/).length > 8) continue
    return line
  }
  return ""
}

export function deriveDocumentTitle(params: {
  fileName: string
  extractedText: string
  metadataTitle?: unknown
}): string {
  const metadataTitle = normalizeText(params.metadataTitle)
  if (metadataTitle) return metadataTitle
  const textTitle = readCandidateTitleFromText(params.extractedText)
  if (textTitle) return textTitle
  return readFileNameBase(params.fileName) || "Document"
}

function normalizeEndpoint(url: string): string {
  return String(url || "").trim().replace(/\/+$/, "")
}

function canUseAzureDocumentIntelligence(): boolean {
  return Boolean(normalizeEndpoint(env.azureDocumentIntelligenceEndpoint) && normalizeText(env.azureDocumentIntelligenceKey))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function extractWithAzureDocumentIntelligence(params: {
  fileName: string
  mimeType: string
  binary: Buffer
}): Promise<string> {
  const endpoint = normalizeEndpoint(env.azureDocumentIntelligenceEndpoint)
  const key = normalizeText(env.azureDocumentIntelligenceKey)
  if (!endpoint || !key) throw new Error("Azure Document Intelligence is not configured.")

  const analyzeResponse = await fetch(
    `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": params.mimeType || "application/octet-stream",
      },
      body: new Uint8Array(params.binary),
    },
  )

  if (!analyzeResponse.ok) {
    const message = await analyzeResponse.text().catch(() => "")
    throw new Error(`Document OCR start failed (${analyzeResponse.status}): ${message || analyzeResponse.statusText}`)
  }

  const operationLocation = analyzeResponse.headers.get("operation-location")
  if (!operationLocation) throw new Error("Document OCR did not return an operation-location header.")

  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (attempt > 0) await delay(Math.min(1000 + attempt * 250, 4000))
    const resultResponse = await fetch(operationLocation, {
      headers: {
        "Ocp-Apim-Subscription-Key": key,
      },
    })
    if (!resultResponse.ok) {
      const message = await resultResponse.text().catch(() => "")
      throw new Error(`Document OCR polling failed (${resultResponse.status}): ${message || resultResponse.statusText}`)
    }
    const payload = (await resultResponse.json()) as any
    const status = normalizeText(payload?.status).toLowerCase()
    if (status === "succeeded") {
      const content = normalizeDocumentText(payload?.analyzeResult?.content)
      if (!content) throw new Error("Document OCR returned no readable text.")
      return content
    }
    if (status === "failed") {
      const message = normalizeText(payload?.error?.message) || "Document OCR failed."
      throw new Error(message)
    }
  }

  throw new Error(`Document OCR timed out for ${params.fileName}.`)
}

export async function extractDocumentText(params: {
  fileName: string
  mimeType: string
  base64Content: string
}): Promise<DocumentExtractionResult> {
  const detectedType = readDocumentType({ fileName: params.fileName, mimeType: params.mimeType })
  if (!detectedType) {
    throw new Error("Alleen PDF, DOC en DOCX worden ondersteund in deze fase.")
  }

  const binary = Buffer.from(String(params.base64Content || ""), "base64")
  if (binary.length === 0) {
    throw new Error("Leeg document ontvangen.")
  }

  if (detectedType === "pdf") {
    const pdfParse = (await import("pdf-parse")).default
    const parsed = await pdfParse(binary).catch(() => null)
    let extractedText = normalizeDocumentText(parsed?.text)
    if (!extractedText && canUseAzureDocumentIntelligence()) {
      extractedText = await extractWithAzureDocumentIntelligence({
        fileName: params.fileName,
        mimeType: params.mimeType,
        binary,
      })
    }
    if (!extractedText) throw new Error("Geen leesbare tekst gevonden in het PDF-document.")
    return {
      extractedText,
      detectedType: "pdf",
      suggestedTitle: deriveDocumentTitle({
        fileName: params.fileName,
        extractedText,
        metadataTitle: parsed?.info?.Title ?? parsed?.metadata?.get?.("Title"),
      }),
    }
  }

  if (detectedType === "doc") {
    const extractedText = extractLegacyDocText(binary)
    if (!extractedText) throw new Error("Geen leesbare tekst gevonden in het DOC-document.")
    return {
      extractedText,
      detectedType: "doc",
      suggestedTitle: deriveDocumentTitle({
        fileName: params.fileName,
        extractedText,
      }),
    }
  }

  const mammoth = await import("mammoth")
  const parsed = await mammoth.extractRawText({ buffer: binary }).catch(() => null)
  let extractedText = normalizeDocumentText(parsed?.value)
  let metadataTitle = ""
  if (!extractedText) {
    const fallback = await extractDocxTextWithJsZip(binary)
    extractedText = fallback.extractedText
    metadataTitle = fallback.metadataTitle
  }
  if (!extractedText) throw new Error("Geen leesbare tekst gevonden in het DOCX-document.")
  return {
    extractedText,
    detectedType: "docx",
    suggestedTitle: deriveDocumentTitle({
      fileName: params.fileName,
      extractedText,
      metadataTitle,
    }),
  }
}

