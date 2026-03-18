import type { Express, RequestHandler } from "express"
import { normalizeText } from "../../ai/shared/normalize"
import { queryOne } from "../../db"
import { requireAuthenticatedUser } from "../../identity/auth"
import { asyncHandler, sendError } from "../../http"
import { listClients } from "../../clients/store"
import { listNotes } from "../../notes/store"
import { readOrganizationSettings } from "../../organizationSettings/store"
import { listReports, readLatestReportIdByInput, saveReport } from "../../reports/store"
import { listSessions, createSession } from "../../sessions/store"
import { extractSnippets } from "../../snippets/extractSnippets"
import { snippetExtractionSystemPrompt } from "../../snippets/extractSnippets"
import { createSnippet, listSnippets, updateSnippet } from "../../snippets/store"
import { readUserSettings } from "../../userSettings/store"
import { ensureActiveTrajectoryForClient, listTrajectories } from "../../trajectories/store"
import type { JsonValue, Report } from "../../types/Report"
import { completePipelineChat } from "../chat/completePipelineChat"
import { buildGroupedClientKnowledgeContext } from "../chat/clientKnowledgeContext"
import { buildReportChatContext } from "../chat/reportChatContext"
import { extractDocumentText, isSupportedDocumentType } from "../inputs/extractDocumentText"
import { selectEvidenceForReport } from "../reports/evidenceSelection"
import { createTemplateFieldIdResolver, generateStructuredReport } from "../reports/generateReport"
import type { PromptSource, PromptSourceType } from "../reports/generateReport"
import { regenerateReportField } from "../reports/regenerateReportField"
import {
  appendFieldVersion,
  buildReportTextFromStructured,
  createStructuredField,
  createStructuredReport,
  updateStructuredReport,
} from "../reports/structuredReportTools"
import { listSupportedUwvTemplates, readSupportedUwvTemplate } from "../templates/uwvTemplates"

type RegisterPipelineRoutesParams = {
  rateLimitAi: RequestHandler
}

type ChatMessage = {
  role: "user" | "assistant"
  text: string
}

type SseWriteableResponse = {
  setHeader: (name: string, value: string) => void
  flushHeaders?: () => void
  write: (chunk: string) => void
  end: () => void
}

function logPipelineDebug(label: string, payload: unknown): void {
  try {
    const serialized = JSON.stringify(payload)
    console.log(`[pipeline:${label}] ${serialized}`)
  } catch {
    // Never let diagnostics break request handling.
  }
}

function mapSessionInputTypeToPromptSourceType(inputType: string): PromptSourceType {
  const normalized = normalizeText(inputType)
  if (normalized === "written_recap") return "Geschreven gespreksverslag"
  if (normalized === "uploaded_document") return "Transcriptie van een gespreksverslag"
  if (normalized === "intake") return "Transcriptie van een gesprek"
  return "Transcriptie van een gesprek"
}

function normalizeLabelList(values: unknown[]): string[] {
  const labels: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const normalized = normalizeText(value)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    labels.push(normalized)
  }
  return labels
}

function readSnippetLabels(snippet: { fieldIds?: string[]; fieldId?: string | null; snippetType?: string | null }): string[] {
  return normalizeLabelList([...(Array.isArray(snippet.fieldIds) ? snippet.fieldIds : []), snippet.fieldId, snippet.snippetType])
}

function shouldLogRecordedSummarySnippetDebug(sourceInputType: string): boolean {
  const normalized = normalizeText(sourceInputType).toLowerCase()
  return normalized === "recording" || normalized === "spoken_recap" || normalized === "spoken"
}

function readChatMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      const role = String((item as any)?.role || "").trim()
      const text = normalizeText((item as any)?.text)
      if ((role !== "user" && role !== "assistant") || !text) return null
      return { role, text } as ChatMessage
    })
    .filter((item): item is ChatMessage => Boolean(item))
}

function wantsChatStreaming(req: any): boolean {
  if (req?.body?.stream === true) return true
  const acceptHeader = String(req?.headers?.accept || "").toLowerCase()
  return acceptHeader.includes("text/event-stream")
}

function initSseResponse(res: SseWriteableResponse): void {
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8")
  res.setHeader("Cache-Control", "no-cache, no-transform")
  res.setHeader("Connection", "keep-alive")
  res.setHeader("X-Accel-Buffering", "no")
  res.flushHeaders?.()
}

function writeSseEvent(res: SseWriteableResponse, event: string, payload: unknown): void {
  const serialized = JSON.stringify(payload ?? {})
  res.write(`event: ${event}\n`)
  res.write(`data: ${serialized}\n\n`)
}

function writeSseDeltaSmooth(res: SseWriteableResponse, delta: string): void {
  const text = String(delta || "")
  if (!text) return
  const pieces = text.split(/(\s+)/).filter(Boolean)
  for (const piece of pieces) {
    writeSseEvent(res, "delta", { delta: piece })
  }
}

function endSseSuccess(res: SseWriteableResponse, response: unknown): void {
  writeSseEvent(res, "final", { response })
  writeSseEvent(res, "done", {})
  res.end()
}

function endSseError(res: SseWriteableResponse, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error || "Onbekende fout")
  writeSseEvent(res, "error", { message })
  res.end()
}

function buildSnippetRows(params: {
  userId: string
  clientId: string
  trajectoryId: string | null
  inputId: string
  sourceInputType: string
  transcript: string
  itemDate: number
}): Promise<
  Array<{
    id: string
    clientId: string
    trajectoryId: string | null
    sourceSessionId: string
    sourceInputId: string
    fieldIds: string[]
    snippetType: string
    fieldId: string
    text: string
    snippetDate: number
    approvalStatus: "pending"
    createdAtUnixMs: number
    updatedAtUnixMs: number
  }>
> {
  const shouldLogSnippetDebug = shouldLogRecordedSummarySnippetDebug(params.sourceInputType)
  if (shouldLogSnippetDebug) {
    console.log(
      "[snippet-debug:recorded-summary] transcript",
      JSON.stringify({
        sourceSessionId: params.inputId,
        clientId: params.clientId,
        trajectoryId: params.trajectoryId,
        sourceInputType: params.sourceInputType,
        transcript: normalizeText(params.transcript),
      }),
    )
  }

  return extractSnippets({
    transcript: params.transcript,
    sourceInputType: params.sourceInputType,
    includeDebug: shouldLogSnippetDebug,
  }).then((result) => {
    if (shouldLogSnippetDebug) {
      const debugChunks = Array.isArray(result.debugChunks) ? result.debugChunks : []
      for (const chunk of debugChunks) {
        console.log(
          "[snippet-debug:recorded-summary] prompt",
          JSON.stringify({
            sourceSessionId: params.inputId,
            sourceInputType: params.sourceInputType,
            chunkIndex: chunk.chunkIndex,
            systemPrompt: snippetExtractionSystemPrompt,
            userPrompt: chunk.promptUsed,
          }),
        )
        console.log(
          "[snippet-debug:recorded-summary] result",
          JSON.stringify({
            sourceSessionId: params.inputId,
            sourceInputType: params.sourceInputType,
            chunkIndex: chunk.chunkIndex,
            rawModelResponse: chunk.rawModelResponse,
            parsedSnippets: chunk.parsedSnippets,
          }),
        )
      }
    }

    const now = Date.now()
    return result.snippets.map((snippet) => ({
      fieldIds: snippet.fields.length > 0 ? snippet.fields : ["general"],
      id: `snippet-${crypto.randomUUID()}`,
      clientId: params.clientId,
      trajectoryId: params.trajectoryId,
      sourceSessionId: params.inputId,
      sourceInputId: params.inputId,
      snippetType: (snippet.fields.length > 0 ? snippet.fields[0] : "general"),
      fieldId: (snippet.fields.length > 0 ? snippet.fields[0] : "general"),
      text: snippet.text,
      snippetDate: params.itemDate,
      approvalStatus: "pending" as const,
      createdAtUnixMs: now,
      updatedAtUnixMs: now,
    }))
  })
}

function buildStandaloneInputChatContext(params: {
  input: {
    id: string
    title: string
    inputType: string
    createdAtUnixMs: number
    transcriptText: string | null
    sourceText: string | null
  }
  snippets: Array<{
    approvalStatus: "pending" | "approved" | "rejected"
    sourceInputId?: string | null
    sourceSessionId: string
    text: string
  }>
  notes: Array<{
    sourceInputId: string | null
    title: string
    text: string
  }>
}): string {
  const sourceInputId = normalizeText(params.input.id)
  const transcript = normalizeText(params.input.transcriptText || params.input.sourceText || "")
  const snippetLines = params.snippets
    .filter((snippet) => snippet.approvalStatus === "approved")
    .filter((snippet) => normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId) === sourceInputId)
    .map((snippet) => normalizeText(snippet.text))
    .filter(Boolean)
    .map((text) => `- ${text}`)
  const noteLines = params.notes
    .filter((note) => normalizeText(note.sourceInputId) === sourceInputId)
    .flatMap((note) => {
      const title = normalizeText(note.title)
      const text = normalizeText(note.text)
      if (title && text) return [`- ${title}: ${text}`]
      if (text) return [`- ${text}`]
      if (title) return [`- ${title}`]
      return []
    })

  return [
    "Samenvatting van relevante sessie-informatie",
    "",
    `Inputtype: ${params.input.inputType}`,
    `Titel: ${normalizeText(params.input.title) || "Naamloze sessie"}`,
    `Datum: ${new Date(Number(params.input.createdAtUnixMs) || Date.now()).toLocaleDateString("nl-NL")}`,
    "",
    transcript ? `Transcript / bron:\n${transcript}` : "Geen transcript of brontekst beschikbaar.",
    "",
    "Goedgekeurde snippets:",
    ...(snippetLines.length > 0 ? snippetLines : ["- Geen goedgekeurde snippets beschikbaar."]),
    "",
    "Notities:",
    ...(noteLines.length > 0 ? noteLines : ["- Geen notities beschikbaar."]),
  ]
    .join("\n")
    .trim()
}

function escapeRegExp(value: string): string {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function extractLegacyFieldAnswer(reportText: string, exportNumberKey: string): string {
  const normalizedReportText = String(reportText || "")
  if (!normalizedReportText.trim()) return ""
  const escapedNumberKey = escapeRegExp(exportNumberKey)
  const headingPattern = String.raw`###\s*${escapedNumberKey}\s+[^\n]*`
  const sectionPattern = new RegExp(
    `${headingPattern}\\s*\\n([\\s\\S]*?)(?=\\n###\\s*[0-9]{1,2}\\.[0-9]{1,2}\\s+|$)`,
    "i",
  )
  const match = normalizedReportText.match(sectionPattern)
  return normalizeText(match?.[1] || "")
}

function resolveTemplateForReport(report: Report) {
  const directCandidates = [normalizeText(report.reportType), normalizeText(report.title)].filter(Boolean)
  for (const candidate of directCandidates) {
    try {
      return readSupportedUwvTemplate(candidate)
    } catch {
      // Try next candidate.
    }
  }
  const normalizedSignature = `${normalizeText(report.reportType)} ${normalizeText(report.title)}`.toLowerCase()
  if (normalizedSignature.includes("eindrapportage")) {
    return readSupportedUwvTemplate("eindrapportage_werkfit_maken")
  }
  if (normalizedSignature.includes("re-integratieplan") || normalizedSignature.includes("reintegratieplan")) {
    return readSupportedUwvTemplate("reintegratieplan_werkfit_maken")
  }
  return null
}

async function ensureStructuredReportForLegacyReport(userId: string, report: Report): Promise<Report> {
  if (report.reportStructuredJson) return report
  const template = resolveTemplateForReport(report)
  if (!template) return report

  const now = Date.now()
  const hydratedFields: Record<string, ReturnType<typeof createStructuredField>> = {}
  for (const field of template.fields) {
    const answer = extractLegacyFieldAnswer(report.reportText, field.exportNumberKey)
    hydratedFields[field.fieldId] = createStructuredField({
      field,
      answer,
      factualBasis: "",
      reasoning: answer ? "Gehydrateerd uit bestaand report_text." : "",
      confidence: field.fieldType === "programmatic" && answer ? 1 : null,
      source: field.fieldType === "manual" ? "manual_edit" : "ai_generation",
      prompt: null,
      createdAtUnixMs: report.createdAtUnixMs || now,
    })
  }

  const structuredReport = createStructuredReport({
    template,
    fields: hydratedFields,
    createdAtUnixMs: report.createdAtUnixMs || now,
  })
  const hydratedReport: Report = {
    ...report,
    reportStructuredJson: structuredReport,
    reportText: normalizeText(report.reportText) || buildReportTextFromStructured(template, structuredReport.fields),
    updatedAtUnixMs: now,
  }
  await saveReport(userId, hydratedReport)
  return hydratedReport
}

export function registerPipelineRoutes(app: Express, params: RegisterPipelineRoutesParams): void {
  app.post(
    "/pipeline/templates",
    asyncHandler(async (_req, res) => {
      res.status(200).json({ templates: listSupportedUwvTemplates() })
    }),
  )

  app.post(
    "/pipeline/extract-document-text",
    asyncHandler(async (req, res) => {
      await requireAuthenticatedUser(req)
      const fileName = normalizeText(req.body?.fileName)
      const mimeType = normalizeText(req.body?.mimeType)
      const base64Content = normalizeText(req.body?.base64Content)
      if (!fileName || !mimeType || !base64Content) {
        sendError(res, 400, "Missing fileName, mimeType or base64Content")
        return
      }
      const extracted = await extractDocumentText({ fileName, mimeType, base64Content })
      res.status(200).json(extracted)
    }),
  )

  app.post(
    "/pipeline/create-input",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const inputId = normalizeText(req.body?.inputId) || `input-${crypto.randomUUID()}`
      const clientId = normalizeText(req.body?.clientId)
      let title = normalizeText(req.body?.title) || "Nieuw input-item"
      const inputType = normalizeText(req.body?.inputType) || "spoken_recap"
      const requestedTrajectoryId = normalizeText(req.body?.trajectoryId) || null
      const uploadFileName = normalizeText(req.body?.uploadFileName) || null
      const sourceMimeType = normalizeText(req.body?.sourceMimeType) || null
      const sourceTextRaw = normalizeText(req.body?.sourceText)
      const documentBase64 = normalizeText(req.body?.documentBase64)
      const createdAtUnixMs = Number.isFinite(Number(req.body?.createdAtUnixMs)) ? Number(req.body.createdAtUnixMs) : Date.now()
      const updatedAtUnixMs = Number.isFinite(Number(req.body?.updatedAtUnixMs)) ? Number(req.body.updatedAtUnixMs) : createdAtUnixMs

      if (!clientId) {
        sendError(res, 400, "Missing clientId")
        return
      }

      const trajectory =
        requestedTrajectoryId
          ? (await listTrajectories(user.userId)).find((item) => item.id === requestedTrajectoryId && item.clientId === clientId) ??
            (await ensureActiveTrajectoryForClient(user.userId, clientId))
          : await ensureActiveTrajectoryForClient(user.userId, clientId)

      let sourceText = sourceTextRaw
      let detectedInputType = inputType
      if (documentBase64) {
        if (!isSupportedDocumentType({ fileName: uploadFileName || "", mimeType: sourceMimeType || "" })) {
          sendError(res, 400, "Uploaded documents must be PDF, DOC or DOCX")
          return
        }
        const extracted = await extractDocumentText({
          fileName: uploadFileName || "document",
          mimeType: sourceMimeType || "",
          base64Content: documentBase64,
        })
        sourceText = extracted.extractedText
        title = normalizeText(extracted.suggestedTitle) || title
        detectedInputType = "uploaded_document"
      }

      await createSession(user.userId, {
        id: inputId,
        clientId,
        trajectoryId: trajectory.id,
        title,
        inputType:
          detectedInputType === "uploaded_document"
            ? "uploaded_document"
            : detectedInputType === "written_recap"
              ? "written_recap"
              : detectedInputType === "recording"
                ? "recording"
                : detectedInputType === "uploaded_audio"
                  ? "uploaded_audio"
                  : "spoken_recap",
        sourceText: sourceText || null,
        sourceMimeType,
        audioUploadId: null,
        audioDurationSeconds: null,
        uploadFileName,
        transcriptText: sourceText || null,
        summaryText: null,
        summaryStructured: null,
        transcriptionStatus: "done",
        transcriptionError: null,
        createdAtUnixMs,
        updatedAtUnixMs,
      })

      let createdSnippets: Array<Record<string, unknown>> = []
      if (sourceText) {
        const snippetRows = await buildSnippetRows({
          userId: user.userId,
          clientId,
          trajectoryId: trajectory.id,
          inputId,
          sourceInputType: detectedInputType,
          transcript: sourceText,
          itemDate: createdAtUnixMs,
        })
        for (const snippet of snippetRows) {
          await createSnippet(user.userId, snippet as any)
        }
        createdSnippets = snippetRows
      }

      res.status(200).json({
        inputId,
        trajectoryId: trajectory.id,
        snippets: createdSnippets,
      })
    }),
  )

  app.post(
    "/pipeline/generate-snippets",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const inputId = normalizeText(req.body?.inputId)
      if (!inputId) {
        sendError(res, 400, "Missing inputId")
        return
      }
      const inputs = await listSessions(user.userId)
      const input = inputs.find((item) => item.id === inputId)
      if (!input) {
        sendError(res, 404, "Input not found")
        return
      }
      const transcript = normalizeText(input.transcriptText || input.sourceText || "")
      if (!transcript) {
        sendError(res, 400, "Input has no text for snippet extraction")
        return
      }
      const trajectory =
        input.trajectoryId && normalizeText(input.trajectoryId)
          ? (await listTrajectories(user.userId)).find((item) => item.id === input.trajectoryId) ?? null
          : input.clientId
            ? await ensureActiveTrajectoryForClient(user.userId, input.clientId)
            : null
      const snippetRows = await buildSnippetRows({
        userId: user.userId,
        clientId: normalizeText(input.clientId),
        trajectoryId: trajectory?.id ?? input.trajectoryId ?? null,
        inputId: input.id,
        sourceInputType: input.inputType,
        transcript,
        itemDate: input.createdAtUnixMs,
      })
      for (const snippet of snippetRows) {
        await createSnippet(user.userId, snippet as any)
      }
      res.status(200).json({ snippets: snippetRows })
    }),
  )

  app.post(
    "/pipeline/approve-snippet",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snippetId = normalizeText(req.body?.snippetId)
      if (!snippetId) {
        sendError(res, 400, "Missing snippetId")
        return
      }
      await updateSnippet(user.userId, {
        id: snippetId,
        approvalStatus: "approved",
        updatedAtUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/pipeline/reject-snippet",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const snippetId = normalizeText(req.body?.snippetId)
      if (!snippetId) {
        sendError(res, 400, "Missing snippetId")
        return
      }
      await updateSnippet(user.userId, {
        id: snippetId,
        approvalStatus: "rejected",
        updatedAtUnixMs: Date.now(),
      })
      res.status(200).json({ ok: true })
    }),
  )

  app.post(
    "/pipeline/generate-report",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const reportId = normalizeText(req.body?.reportId) || `report-${crypto.randomUUID()}`
      const templateId = normalizeText(req.body?.templateId)
      const clientId = normalizeText(req.body?.clientId)
      const selectedInputIds = Array.isArray(req.body?.selectedInputIds) ? req.body.selectedInputIds.map((id: unknown) => normalizeText(id)).filter(Boolean) : []
      const selectedNoteIds = Array.isArray(req.body?.selectedNoteIds) ? req.body.selectedNoteIds.map((id: unknown) => normalizeText(id)).filter(Boolean) : []
      if (!templateId || !clientId) {
        sendError(res, 400, "Missing templateId or clientId")
        return
      }

      const template = readSupportedUwvTemplate(templateId)
      const [clients, trajectories, inputs, notes, snippets, organizationSettings, userSettings] = await Promise.all([
        listClients(user.userId),
        listTrajectories(user.userId),
        listSessions(user.userId),
        listNotes(user.userId),
        listSnippets(user.userId),
        readOrganizationSettings(user.userId),
        readUserSettings(user.userId),
      ])
      const client = clients.find((item) => item.id === clientId) ?? null
      let evidence
      try {
        evidence = selectEvidenceForReport({
          inputs,
          notes,
          snippets,
          selectedInputIds,
          selectedNoteIds,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : "Evidenceselectie mislukt. Selecteer minder inputs/notities."
        sendError(res, 400, message)
        return
      }

      const selectedInputIdSet = new Set(selectedInputIds)
      const snippetsFromSelectedInputs = snippets.filter((snippet) => {
        const sourceInputId = normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
        return sourceInputId && selectedInputIdSet.has(sourceInputId)
      })
      const evidenceByFieldIdEntries = Array.from(evidence.evidenceByFieldId.entries()).map(([fieldId, lines]) => ({
        fieldId,
        lines,
      }))
      logPipelineDebug("generate-report:evidence", {
        templateId,
        clientId,
        selectedInputIds,
        selectedNoteIds,
        totalSnippetsInWorkspace: snippets.length,
        snippetsFromSelectedInputsCount: snippetsFromSelectedInputs.length,
        approvedSnippetsUsedCount: evidence.approvedSnippets.length,
        snippetsFromSelectedInputs: snippetsFromSelectedInputs.map((snippet) => ({
          id: snippet.id,
          approvalStatus: snippet.approvalStatus,
          sourceInputId: normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId),
          fieldIds: readSnippetLabels(snippet),
          text: normalizeText(snippet.text),
        })),
        approvedSnippetsUsed: evidence.approvedSnippets.map((snippet) => ({
          id: snippet.id,
          sourceInputId: normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId),
          fieldIds: readSnippetLabels(snippet),
          text: normalizeText(snippet.text),
        })),
        evidenceByFieldId: evidenceByFieldIdEntries,
      })

      const trajectory =
        evidence.selectedInputs.find((input) => input.trajectoryId)?.trajectoryId
          ? trajectories.find((item) => item.id === evidence.selectedInputs.find((input) => input.trajectoryId)?.trajectoryId) ?? null
          : await ensureActiveTrajectoryForClient(user.userId, clientId)
      const selectedInputById = new Map(evidence.selectedInputs.map((item) => [item.id, item]))
      const promptSources: PromptSource[] = [
        ...evidence.approvedSnippets
          .filter((snippet) => {
            const sourceInputId = normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
            const sourceInput = selectedInputById.get(sourceInputId)
            return sourceInput?.inputType !== "written_recap"
          })
          .map((snippet) => {
          const sourceInputId = normalizeText(snippet.sourceInputId ?? snippet.sourceSessionId)
          const sourceInput = selectedInputById.get(sourceInputId)
          return {
            sourceId: sourceInputId || snippet.id,
            dateUnixMs: Number.isFinite(snippet.snippetDate) ? snippet.snippetDate : sourceInput?.createdAtUnixMs ?? Date.now(),
            sourceType: mapSessionInputTypeToPromptSourceType(sourceInput?.inputType || ""),
            sourceTitle: normalizeText(sourceInput?.title) || `Input ${sourceInputId || "onbekend"}`,
            text: normalizeText(snippet.text),
            labels: readSnippetLabels(snippet),
          }
        }),
        ...evidence.selectedInputs
          .filter((input) => input.inputType === "written_recap")
          .map((input) => ({
            sourceId: input.id,
            dateUnixMs: input.createdAtUnixMs,
            sourceType: "Geschreven gespreksverslag" as const,
            sourceTitle: normalizeText(input.title) || `Input ${input.id}`,
            text: normalizeText(input.sourceText || input.transcriptText || ""),
            labels: normalizeLabelList(["general_notes"]),
          }))
          .filter((source) => source.text.length > 0),
        ...evidence.selectedNotes.map((note) => ({
          sourceId: note.id,
          dateUnixMs: Number.isFinite(note.createdAtUnixMs) ? note.createdAtUnixMs : Date.now(),
          sourceType: "Notitie" as const,
          sourceTitle: normalizeText(note.title) || `Notitie ${note.id}`,
          text: normalizeText(note.text),
          labels: normalizeLabelList(["general_notes"]),
        })),
      ]
      if (promptSources.length === 0) {
        sendError(res, 400, "Geen bruikbare broninformatie gevonden voor rapportgeneratie.")
        return
      }
      const generated = await generateStructuredReport({
        template,
        client,
        trajectory,
        organizationSettings,
        userSettings,
        evidenceByFieldId: evidence.evidenceByFieldId,
        promptSources,
      })
      const now = Date.now()
      const report = {
        id: reportId,
        clientId,
        trajectoryId: trajectory?.id ?? null,
        sourceSessionId: evidence.selectedInputs[0]?.id ?? null,
        title: normalizeText(req.body?.title) || template.name,
        reportType: template.id,
        reportText: generated.reportText,
        reportStructuredJson: generated.structuredReport,
        reportDate: null,
        createdAtUnixMs: now,
        updatedAtUnixMs: now,
        state: "needs_review" as const,
      }
      await saveReport(user.userId, report)
      res.status(200).json({ report })
    }),
  )

  app.post(
    "/pipeline/regenerate-report-field",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const reportId = normalizeText(req.body?.reportId)
      const fieldId = normalizeText(req.body?.fieldId)
      const userPrompt = normalizeText(req.body?.userPrompt)
      if (!reportId || !fieldId) {
        sendError(res, 400, "Missing reportId or fieldId")
        return
      }
      const report = (await listReports(user.userId)).find((item) => item.id === reportId)
      if (!report?.reportStructuredJson) {
        sendError(res, 404, "Structured report not found")
        return
      }
      const template = readSupportedUwvTemplate(report.reportStructuredJson.templateId)
      const currentField = report.reportStructuredJson.fields[fieldId]
      if (!currentField) {
        sendError(res, 404, "Field not found")
        return
      }
      if (currentField.fieldType !== "ai") {
        sendError(res, 400, "Alleen AI-velden kunnen worden geregenereerd")
        return
      }
      const updatedField = await regenerateReportField({ field: currentField, userPrompt: userPrompt || null })
      const updatedFields = { ...report.reportStructuredJson.fields, [fieldId]: updatedField }
      const updatedStructuredReport = updateStructuredReport({
        report: report.reportStructuredJson,
        fields: updatedFields,
      })
      const reportText = buildReportTextFromStructured(template, updatedStructuredReport.fields)
      const updatedReport = {
        ...report,
        reportStructuredJson: updatedStructuredReport,
        reportText,
        updatedAtUnixMs: Date.now(),
      }
      await saveReport(user.userId, updatedReport)
      res.status(200).json({ report: updatedReport, field: updatedField })
    }),
  )

  app.post(
    "/pipeline/save-report-field-edit",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const reportId = normalizeText(req.body?.reportId)
      const fieldId = normalizeText(req.body?.fieldId)
      const answer = req.body?.answer
      if (!reportId || !fieldId) {
        sendError(res, 400, "Missing reportId or fieldId")
        return
      }
      const report = (await listReports(user.userId)).find((item) => item.id === reportId)
      if (!report?.reportStructuredJson) {
        sendError(res, 404, "Structured report not found")
        return
      }
      const template = readSupportedUwvTemplate(report.reportStructuredJson.templateId)
      const currentField = report.reportStructuredJson.fields[fieldId]
      if (!currentField) {
        sendError(res, 404, "Field not found")
        return
      }
      const updatedField = appendFieldVersion({
        field: currentField,
        source: "manual_edit",
        answer: answer ?? "",
        prompt: null,
      })
      const updatedFields = { ...report.reportStructuredJson.fields, [fieldId]: updatedField }
      const updatedStructuredReport = updateStructuredReport({
        report: report.reportStructuredJson,
        fields: updatedFields,
      })
      const reportText = buildReportTextFromStructured(template, updatedStructuredReport.fields)
      const updatedReport = {
        ...report,
        reportStructuredJson: updatedStructuredReport,
        reportText,
        updatedAtUnixMs: Date.now(),
      }
      await saveReport(user.userId, updatedReport)
      res.status(200).json({ report: updatedReport, field: updatedField })
    }),
  )

  app.post(
    "/pipeline/chat/client",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const clientId = normalizeText(req.body?.clientId)
      const messages = readChatMessages(req.body?.messages)
      if (!clientId || messages.length === 0) {
        sendError(res, 400, "Missing clientId or messages")
        return
      }
      const [inputs, snippets, notes] = await Promise.all([listSessions(user.userId), listSnippets(user.userId), listNotes(user.userId)])
      const context = buildGroupedClientKnowledgeContext({
        clientId,
        inputs,
        snippets,
        notes,
      })
      if (wantsChatStreaming(req)) {
        initSseResponse(res)
        try {
          const response = await completePipelineChat({
            tool: "sendClientChatMessage",
            context,
            messages,
            onDelta: (delta) => writeSseDeltaSmooth(res, delta),
          })
          endSseSuccess(res, response)
        } catch (error) {
          endSseError(res, error)
        }
        return
      }
      const response = await completePipelineChat({ tool: "sendClientChatMessage", context, messages })
      res.status(200).json(response)
    }),
  )

  app.post(
    "/pipeline/chat/input",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const inputId = normalizeText(req.body?.inputId)
      const messages = readChatMessages(req.body?.messages)
      if (!inputId || messages.length === 0) {
        sendError(res, 400, "Missing inputId or messages")
        return
      }
      const inputs = await listSessions(user.userId)
      const selectedInput = inputs.find((input) => input.id === inputId)
      if (!selectedInput) {
        sendError(res, 404, "Input not found")
        return
      }
      const [snippets, notes] = await Promise.all([listSnippets(user.userId), listNotes(user.userId)])
      const context = selectedInput.clientId
        ? buildGroupedClientKnowledgeContext({
            clientId: selectedInput.clientId,
            inputId,
            inputs,
            snippets,
            notes,
          })
        : buildStandaloneInputChatContext({
            input: selectedInput,
            snippets,
            notes,
          })
      if (wantsChatStreaming(req)) {
        initSseResponse(res)
        try {
          const response = await completePipelineChat({
            tool: "sendInputChatMessage",
            context,
            messages,
            onDelta: (delta) => writeSseDeltaSmooth(res, delta),
          })
          endSseSuccess(res, response)
        } catch (error) {
          endSseError(res, error)
        }
        return
      }
      const response = await completePipelineChat({ tool: "sendInputChatMessage", context, messages })
      res.status(200).json(response)
    }),
  )

  app.post(
    "/pipeline/chat/report",
    params.rateLimitAi,
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const reportId = normalizeText(req.body?.reportId)
      const messages = readChatMessages(req.body?.messages)
      if (!reportId || messages.length === 0) {
        sendError(res, 400, "Missing reportId or messages")
        return
      }
      const report = (await listReports(user.userId)).find((item) => item.id === reportId)
      if (!report?.reportStructuredJson) {
        sendError(res, 404, "Structured report not found")
        return
      }
      const structuredReport = report.reportStructuredJson
      const template = readSupportedUwvTemplate(structuredReport.templateId)
      const resolveFieldId = createTemplateFieldIdResolver(template)
      const [snippets, notes] = await Promise.all([listSnippets(user.userId), listNotes(user.userId)])
      const context = buildReportChatContext({
        reportId,
        template,
        fields: structuredReport.fields,
        clientId: report.clientId,
        sourceInputId: report.sourceSessionId,
        snippets,
        notes,
      })

      const parseJsonLikeAnswer = (value: JsonValue): JsonValue => {
        if (typeof value !== "string") return value
        const trimmed = normalizeText(value)
        if (!trimmed) return ""
        const looksJson = (trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))
        if (!looksJson) return value
        try {
          return JSON.parse(trimmed) as JsonValue
        } catch {
          return value
        }
      }

      const normalizeFieldUpdateAnswer = (fieldId: string, rawAnswer: JsonValue): JsonValue | null => {
        const templateField = template.fields.find((field) => field.fieldId === fieldId)
        const variant = templateField?.aiConfig?.frontendVariant
        const normalized = parseJsonLikeAnswer(rawAnswer)
        if (!variant) return normalized

        const asObject = (value: JsonValue): Record<string, JsonValue> | null => {
          if (!value || typeof value !== "object" || Array.isArray(value)) return null
          return value as Record<string, JsonValue>
        }
        const asNumber = (value: JsonValue): number | null => {
          if (typeof value === "number" && Number.isFinite(value)) return value
          if (typeof value !== "string") return null
          const parsed = Number(value)
          return Number.isFinite(parsed) ? parsed : null
        }
        const normalizeActivities = (value: JsonValue): Array<{ activiteit: string; uren: number }> => {
          if (!Array.isArray(value)) return []
          return value
            .map((item) => {
              if (!item || typeof item !== "object" || Array.isArray(item)) return null
              const row = item as Record<string, JsonValue>
              const activiteit = normalizeText(row.activiteit)
              const uren = asNumber(row.uren)
              if (!activiteit && (uren === null || uren <= 0)) return null
              return { activiteit, uren: uren ?? 0 }
            })
            .filter((item): item is { activiteit: string; uren: number } => Boolean(item))
        }

        if (variant === "single_choice_numeric") {
          const keyMap: Record<string, string> = {
            rp_werkfit_8_1: "keuze",
            er_werkfit_4_2: "keuze",
            er_werkfit_7_3: "resultaat",
          }
          const key = keyMap[fieldId] || "keuze"
          const objectValue = asObject(normalized)
          const selected = objectValue ? asNumber(objectValue[key]) : null
          if (!objectValue || selected === null) return null
          return { ...objectValue, [key]: selected }
        }

        if (variant === "single_choice_with_custom_reason") {
          const objectValue = asObject(normalized)
          const reden = objectValue ? asNumber(objectValue.reden) : null
          if (!objectValue || reden === null) return null
          const customReason = normalizeText(objectValue.customReason)
          if (reden === 6 && !customReason) return null
          return {
            ...objectValue,
            reden,
            customReason: reden === 6 ? customReason : "",
          }
        }

        if (variant === "akkoord_met_toelichting") {
          const objectValue = asObject(normalized)
          const akkoord = objectValue ? asNumber(objectValue.akkoord) : null
          if (!objectValue || akkoord === null) return null
          const toelichting = normalizeText(objectValue.toelichting)
          if (akkoord === 2 && !toelichting) return null
          return { ...objectValue, akkoord, toelichting }
        }

        if (variant === "activities_rows") {
          if (Array.isArray(normalized)) {
            return { activiteiten: normalizeActivities(normalized) }
          }
          const objectValue = asObject(normalized)
          if (!objectValue) return null
          return {
            activiteiten: normalizeActivities(
              objectValue.activiteiten ?? objectValue.rows ?? objectValue.items ?? [],
            ),
          }
        }

        if (variant === "activiteiten_en_keuzes") {
          const objectValue = asObject(normalized)
          if (!objectValue) return null
          const keuzesRaw = Array.isArray(objectValue.keuzes) ? objectValue.keuzes : []
          const keuzes = keuzesRaw
            .map((item) => asNumber(item))
            .filter((item): item is number => item !== null)
          return {
            keuzes,
            activiteiten: normalizeActivities(objectValue.activiteiten ?? []),
          }
        }

        if (variant === "maanden_object") {
          const objectValue = asObject(normalized)
          const maanden = objectValue ? asNumber(objectValue.maanden) : null
          if (!objectValue || maanden === null) return null
          return { maanden }
        }

        if (variant === "uren_motivering") {
          const objectValue = asObject(normalized)
          const uren = objectValue ? asNumber(objectValue.uren) : null
          const motivering = objectValue ? normalizeText(objectValue.motivering) : ""
          if (!objectValue || uren === null || !motivering) return null
          return { uren, motivering }
        }

        if (variant === "tarief_motivering") {
          const objectValue = asObject(normalized)
          const tarief = objectValue ? asNumber(objectValue.tarief) : null
          const motivering = objectValue ? normalizeText(objectValue.motivering) : ""
          if (!objectValue || tarief === null || !motivering) return null
          return { tarief, motivering }
        }

        return normalized
      }

      const applyReportFieldUpdates = async (chat: Awaited<ReturnType<typeof completePipelineChat>>) => {
        if (!chat.fieldUpdates || chat.fieldUpdates.length === 0) return chat
        const updatedFields = { ...structuredReport.fields }
        const appliedFieldUpdates: Array<{ fieldId: string; answer: string }> = []
        const answerToText = (value: unknown): string => {
          if (typeof value === "string") return value
          if (value === null || typeof value === "undefined") return ""
          if (typeof value === "object") return JSON.stringify(value)
          return String(value)
        }
        for (const fieldUpdate of chat.fieldUpdates) {
          const resolvedFieldId = resolveFieldId(fieldUpdate.fieldId)
          if (!resolvedFieldId) continue
          const existingField = updatedFields[resolvedFieldId]
          if (!existingField) continue
          if (existingField.fieldType !== "ai") continue
          const normalizedAnswer = normalizeFieldUpdateAnswer(resolvedFieldId, fieldUpdate.answer)
          if (normalizedAnswer === null) continue
          const nextField = appendFieldVersion({
            field: existingField,
            source: "chat_update",
            answer: normalizedAnswer,
            prompt: null,
          })
          updatedFields[resolvedFieldId] = nextField
          appliedFieldUpdates.push({ fieldId: resolvedFieldId, answer: answerToText(nextField.answer) })
        }
        const updatedStructuredReport = updateStructuredReport({
          report: structuredReport,
          fields: updatedFields,
        })
        const reportText = buildReportTextFromStructured(template, updatedStructuredReport.fields)
        const updatedReport = {
          ...report,
          reportStructuredJson: updatedStructuredReport,
          reportText,
          updatedAtUnixMs: Date.now(),
        }
        await saveReport(user.userId, updatedReport)
        return { ...chat, fieldUpdates: appliedFieldUpdates }
      }

      if (wantsChatStreaming(req)) {
        initSseResponse(res)
        try {
          const chat = await completePipelineChat({
            tool: "sendReportChatMessage",
            context,
            messages,
            allowFieldUpdates: true,
          })
          const updatedChat = await applyReportFieldUpdates(chat)
          endSseSuccess(res, updatedChat)
        } catch (error) {
          endSseError(res, error)
        }
        return
      }

      const chat = await completePipelineChat({
        tool: "sendReportChatMessage",
        context,
        messages,
        allowFieldUpdates: true,
      })
      const updatedChat = await applyReportFieldUpdates(chat)
      res.status(200).json(updatedChat)
    }),
  )

  app.post(
    "/pipeline/report",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const reportId = normalizeText(req.body?.reportId)
      if (!reportId) {
        sendError(res, 400, "Missing reportId")
        return
      }
      const report = (await listReports(user.userId)).find((item) => item.id === reportId)
      if (!report) {
        sendError(res, 404, "Report not found")
        return
      }
      const ensuredStructured = await ensureStructuredReportForLegacyReport(user.userId, report)
      res.status(200).json({ report: ensuredStructured })
    }),
  )

  app.post(
    "/pipeline/report-by-input",
    asyncHandler(async (req, res) => {
      const user = await requireAuthenticatedUser(req)
      const inputId = normalizeText(req.body?.inputId)
      if (!inputId) {
        sendError(res, 400, "Missing inputId")
        return
      }
      const reportId = await readLatestReportIdByInput(user.userId, inputId)
      if (!reportId) {
        sendError(res, 404, "Report not found for input")
        return
      }
      const report = (await listReports(user.userId)).find((item) => item.id === reportId)
      if (!report) {
        sendError(res, 404, "Report not found")
        return
      }
      const ensuredStructured = await ensureStructuredReportForLegacyReport(user.userId, report)
      res.status(200).json({ report: ensuredStructured })
    }),
  )
}
