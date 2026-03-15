import assert from "node:assert/strict"
import test from "node:test"
import { env } from "../../env"
import { sanitizeMedicalContent } from "../../snippets/sanitizeMedicalContent"
import type { Client } from "../../types/Client"
import type { Note } from "../../types/Note"
import type { OrganizationSettings } from "../../types/OrganizationSettings"
import type { StructuredReportField } from "../../types/Report"
import type { Session } from "../../types/Session"
import type { Snippet } from "../../types/Snippet"
import type { Trajectory } from "../../types/Trajectory"
import type { UserSettings } from "../../types/UserSettings"
import { createPipelineChatResponse } from "../chat/chatContract"
import { generateStructuredReport } from "../reports/generateReport"
import { regenerateReportField } from "../reports/regenerateReportField"
import { selectEvidenceForReport } from "../reports/evidenceSelection"
import { appendFieldVersion, buildReportTextFromStructured, updateStructuredReport } from "../reports/structuredReportTools"
import { readSupportedUwvTemplate, type UwvTemplate } from "../templates/uwvTemplates"

function createSession(params: {
  id: string
  clientId: string
  trajectoryId: string
  inputType: Session["inputType"]
  sourceText: string
}): Session {
  return {
    id: params.id,
    clientId: params.clientId,
    trajectoryId: params.trajectoryId,
    title: "Input",
    inputType: params.inputType,
    sourceText: params.sourceText,
    sourceMimeType: params.inputType === "uploaded_document" ? "application/pdf" : null,
    audioUploadId: null,
    audioDurationSeconds: null,
    uploadFileName: params.inputType === "uploaded_document" ? "bewijs.pdf" : null,
    transcriptText: params.sourceText,
    summaryText: null,
    summaryStructured: null,
    transcriptionStatus: "done",
    transcriptionError: null,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createNote(id: string, clientId: string, sourceInputId: string | null, text: string): Note {
  return {
    id,
    clientId,
    sourceInputId,
    sessionId: sourceInputId || "",
    title: `Notitie ${id}`,
    text,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createSnippet(params: {
  id: string
  clientId: string
  trajectoryId: string
  sourceInputId: string
  fieldId: string
  text: string
  approvalStatus: Snippet["approvalStatus"]
}): Snippet {
  return {
    id: params.id,
    clientId: params.clientId,
    trajectoryId: params.trajectoryId,
    sourceSessionId: params.sourceInputId,
    sourceInputId: params.sourceInputId,
    snippetType: params.fieldId,
    fieldId: params.fieldId,
    text: params.text,
    snippetDate: 1,
    approvalStatus: params.approvalStatus,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createClient(clientId: string): Client {
  return {
    id: clientId,
    name: "Jan Jansen",
    clientDetails: "BSN 123456789",
    employerDetails: "",
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
    isArchived: false,
  }
}

function createTrajectory(clientId: string, trajectoryId: string): Trajectory {
  return {
    id: trajectoryId,
    clientId,
    isActive: true,
    name: "Werkfit traject",
    serviceType: "werkfit",
    uwvContactName: "UWV Contact",
    uwvContactPhone: null,
    uwvContactEmail: null,
    orderNumber: "ORD-2026-001",
    startDate: "2026-01-12",
    planOfAction: null,
    maxHours: 30,
    maxAdminHours: 10,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createOrganizationSettings(): OrganizationSettings {
  return {
    practiceName: "Coachscribe Praktijk",
    website: "https://coachscribe.example",
    visitAddress: "Stationsstraat 1",
    postalAddress: "Postbus 1",
    postalCodeCity: "1234AB Amsterdam",
    tintColor: "#BE0165",
    logoDataUrl: null,
    updatedAtUnixMs: 1,
  }
}

function createUserSettings(): UserSettings {
  return {
    contactName: "Coach Contact",
    contactRole: "Re-integratiecoach",
    contactPhone: "0201234567",
    contactEmail: "coach@example.com",
    updatedAtUnixMs: 1,
  }
}

function buildDeterministicExportPayload(template: UwvTemplate, fields: Record<string, StructuredReportField>): Record<string, string> {
  const payload: Record<string, string> = {}
  for (const templateField of template.fields) {
    const answer = String(fields[templateField.fieldId]?.answer || "").trim()
    if (!answer) continue
    payload[templateField.fieldId] = answer
    payload[templateField.exportNumberKey.replace(".", "_")] = answer
  }
  return payload
}

async function withDisabledAzureDeployments<T>(callback: () => Promise<T>): Promise<T> {
  const mutableEnv = env as { azureOpenAiSummaryDeployment: string; azureOpenAiChatDeployment: string }
  const originalSummary = mutableEnv.azureOpenAiSummaryDeployment
  const originalChat = mutableEnv.azureOpenAiChatDeployment
  mutableEnv.azureOpenAiSummaryDeployment = ""
  mutableEnv.azureOpenAiChatDeployment = ""
  try {
    return await callback()
  } finally {
    mutableEnv.azureOpenAiSummaryDeployment = originalSummary
    mutableEnv.azureOpenAiChatDeployment = originalChat
  }
}

test("mocked spoken recap pipeline keeps fieldId stable across generation, regeneration, chat update and export payload", async () => {
  const template = readSupportedUwvTemplate("reintegratieplan_werkfit_maken")
  const clientId = "client-1"
  const trajectoryId = "trajectory-1"
  const input = createSession({
    id: "input-1",
    clientId,
    trajectoryId,
    inputType: "spoken_recap",
    sourceText: "Client heeft depressie en plant 4 uur vrijwilligerswerk per week.",
  })
  const notes = [createNote("note-1", clientId, input.id, "Coach bewaakt opbouw en haalbaarheid.")]

  const pendingSnippets = [
    createSnippet({
      id: "snippet-1",
      clientId,
      trajectoryId,
      sourceInputId: input.id,
      fieldId: "rp_werkfit_5_1",
      text: sanitizeMedicalContent("Client heeft depressie en werkt toe naar vrijwilligerswerk."),
      approvalStatus: "pending",
    }),
    createSnippet({
      id: "snippet-2",
      clientId,
      trajectoryId,
      sourceInputId: input.id,
      fieldId: "rp_werkfit_5_3",
      text: "Begeleidingsuren verdeeld over sollicitatie- en netwerkactiviteiten.",
      approvalStatus: "pending",
    }),
  ]
  assert.match(pendingSnippets[0].text, /mentale belastingsklachten/i)

  const snippets = pendingSnippets.map((snippet) =>
    snippet.id === "snippet-1" ? { ...snippet, approvalStatus: "approved" as const } : snippet,
  )

  const evidence = selectEvidenceForReport({
    inputs: [input],
    notes,
    snippets,
    selectedInputIds: [input.id],
    selectedNoteIds: [notes[0].id],
  })
  assert.equal(evidence.approvedSnippets.length, 1)
  assert.equal(evidence.approvedSnippets[0].fieldId, "rp_werkfit_5_1")

  await withDisabledAzureDeployments(async () => {
    const generated = await generateStructuredReport({
      template,
      client: createClient(clientId),
      trajectory: createTrajectory(clientId, trajectoryId),
      organizationSettings: createOrganizationSettings(),
      userSettings: createUserSettings(),
      evidenceByFieldId: evidence.evidenceByFieldId,
    })
    const targetFieldId = "rp_werkfit_5_1"
    const generatedField = generated.structuredReport.fields[targetFieldId]
    assert.equal(generatedField.fieldId, targetFieldId)
    assert.equal(generatedField.versions.length, 1)
    assert.equal(generatedField.versions[0].source, "ai_generation")

    const regeneratedField = await regenerateReportField({
      field: generatedField,
      userPrompt: "Maak het kort en zakelijk.",
    })
    assert.equal(regeneratedField.fieldId, targetFieldId)
    assert.equal(regeneratedField.versions.length, 2)
    assert.equal(regeneratedField.versions[1].source, "ai_regeneration")

    const reportAfterRegeneration = updateStructuredReport({
      report: generated.structuredReport,
      fields: {
        ...generated.structuredReport.fields,
        [targetFieldId]: regeneratedField,
      },
      updatedAtUnixMs: 2,
    })

    const chatResponse = createPipelineChatResponse({
      tool: "sendReportChatMessage",
      answer: "Aangepast.",
      fieldUpdates: [{ fieldId: targetFieldId, answer: "Definitieve formulering na coachchat." }],
    })
    const fieldUpdates = chatResponse.fieldUpdates ?? []
    assert.equal(fieldUpdates.length, 1)
    const chatUpdatedField = appendFieldVersion({
      field: reportAfterRegeneration.fields[targetFieldId],
      source: "chat_update",
      answer: fieldUpdates[0].answer,
      prompt: null,
      createdAtUnixMs: 3,
    })
    const reportAfterChat = updateStructuredReport({
      report: reportAfterRegeneration,
      fields: {
        ...reportAfterRegeneration.fields,
        [targetFieldId]: chatUpdatedField,
      },
      updatedAtUnixMs: 3,
    })

    assert.equal(reportAfterChat.fields[targetFieldId].fieldId, targetFieldId)
    assert.equal(reportAfterChat.fields[targetFieldId].versions.length, 3)
    assert.equal(reportAfterChat.fields[targetFieldId].versions[2].source, "chat_update")
    assert.equal(reportAfterChat.fields[targetFieldId].answer, "Definitieve formulering na coachchat.")

    const reportText = buildReportTextFromStructured(template, reportAfterChat.fields)
    assert.match(reportText, /### 5\.1/)
    assert.match(reportText, /Definitieve formulering na coachchat\./)

    const exportPayload = buildDeterministicExportPayload(template, reportAfterChat.fields)
    assert.equal(exportPayload["rp_werkfit_5_1"], "Definitieve formulering na coachchat.")
    assert.equal(exportPayload["5_1"], "Definitieve formulering na coachchat.")
  })
})

test("mocked uploaded PDF/DOCX flow uses extracted text for snippets and report generation", async () => {
  async function mockExtractDocumentText() {
    return {
      detectedType: "pdf" as const,
      extractedText:
        "Documenttekst: client voert arbeidsmarktoriëntatie uit en bouwt sollicitatieritme op met 3 uur begeleiding per week.",
    }
  }

  function mockGenerateSnippetsFromExtractedText(params: { clientId: string; trajectoryId: string; inputId: string; extractedText: string }): Snippet[] {
    return [
      createSnippet({
        id: "snippet-doc-1",
        clientId: params.clientId,
        trajectoryId: params.trajectoryId,
        sourceInputId: params.inputId,
        fieldId: "er_werkfit_7_1",
        text: params.extractedText,
        approvalStatus: "approved",
      }),
    ]
  }

  const template = readSupportedUwvTemplate("eindrapportage_werkfit_maken")
  const clientId = "client-1"
  const trajectoryId = "trajectory-1"
  const extracted = await mockExtractDocumentText()
  const input = createSession({
    id: "input-doc-1",
    clientId,
    trajectoryId,
    inputType: "uploaded_document",
    sourceText: extracted.extractedText,
  })
  const snippets = mockGenerateSnippetsFromExtractedText({
    clientId,
    trajectoryId,
    inputId: input.id,
    extractedText: extracted.extractedText,
  })
  const notes = [createNote("note-doc-1", clientId, input.id, "Coach bevestigt dat het document leidend is voor eindrapportage.")]

  const evidence = selectEvidenceForReport({
    inputs: [input],
    notes,
    snippets,
    selectedInputIds: [input.id],
    selectedNoteIds: [notes[0].id],
  })
  assert.equal(evidence.approvedSnippets.length, 1)
  assert.deepEqual(evidence.evidenceByFieldId.get("er_werkfit_7_1"), [extracted.extractedText])

  await withDisabledAzureDeployments(async () => {
    const generated = await generateStructuredReport({
      template,
      client: createClient(clientId),
      trajectory: createTrajectory(clientId, trajectoryId),
      organizationSettings: createOrganizationSettings(),
      userSettings: createUserSettings(),
      evidenceByFieldId: evidence.evidenceByFieldId,
    })

    const activitiesField = generated.structuredReport.fields["er_werkfit_7_1"]
    assert.equal(activitiesField.fieldId, "er_werkfit_7_1")
    assert.match(activitiesField.factualBasis, /Documenttekst:/)

    const reportText = buildReportTextFromStructured(template, generated.structuredReport.fields)
    assert.match(reportText, /### 7\.1/)
    assert.match(reportText, /arbeidsmarktoriëntatie/i)
  })
})
