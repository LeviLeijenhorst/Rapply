import assert from "node:assert/strict"
import test from "node:test"
import { deriveDocumentTitle } from "./extractDocumentText"

test("deriveDocumentTitle prefers embedded metadata title", () => {
  const title = deriveDocumentTitle({
    fileName: "uwv-rapport.pdf",
    extractedText: "Voorblad\nInhoud",
    metadataTitle: "Definitief UWV Rapport",
  })

  assert.equal(title, "Definitief UWV Rapport")
})

test("deriveDocumentTitle falls back to first meaningful text line", () => {
  const title = deriveDocumentTitle({
    fileName: "scan.pdf",
    extractedText: "\n\nArbeidsdeskundig Onderzoek\nDit document beschrijft de belastbaarheid.\n",
  })

  assert.equal(title, "Arbeidsdeskundig Onderzoek")
})

test("deriveDocumentTitle falls back to file name when no text title is available", () => {
  const title = deriveDocumentTitle({
    fileName: "C:\\uploads\\voortgangsrapportage-client-jansen.docx",
    extractedText: "",
  })

  assert.equal(title, "voortgangsrapportage-client-jansen")
})
