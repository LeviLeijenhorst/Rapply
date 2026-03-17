import assert from "node:assert/strict"
import test from "node:test"
import { env } from "../../env"
import type { Client } from "../../types/Client"
import type { OrganizationSettings } from "../../types/OrganizationSettings"
import type { Trajectory } from "../../types/Trajectory"
import type { UserSettings } from "../../types/UserSettings"
import { createTemplateFieldIdResolver, generateStructuredReport } from "./generateReport"
import { listAiTemplateFields, readSupportedUwvTemplate } from "../templates/uwvTemplates"

async function withDisabledAzureDeployments<T>(callback: () => Promise<T>): Promise<T> {
  const mutableEnv = env as { azureOpenAiSummaryDeployment: string; azureOpenAiChatDeployment: string; azureOpenAiReportDeployment: string }
  const originalSummary = mutableEnv.azureOpenAiSummaryDeployment
  const originalChat = mutableEnv.azureOpenAiChatDeployment
  const originalReport = mutableEnv.azureOpenAiReportDeployment
  mutableEnv.azureOpenAiSummaryDeployment = ""
  mutableEnv.azureOpenAiChatDeployment = ""
  mutableEnv.azureOpenAiReportDeployment = ""
  try {
    return await callback()
  } finally {
    mutableEnv.azureOpenAiSummaryDeployment = originalSummary
    mutableEnv.azureOpenAiChatDeployment = originalChat
    mutableEnv.azureOpenAiReportDeployment = originalReport
  }
}

function createClient(): Client {
  return {
    id: "client-1",
    name: "Jan Jansen",
    clientDetails: "BSN 123456789",
    employerDetails: "",
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
    isArchived: false,
  }
}

function createTrajectory(): Trajectory {
  return {
    id: "trajectory-1",
    clientId: "client-1",
    isActive: true,
    name: "Werkfit",
    serviceType: "werkfit",
    uwvContactName: "UWV Contact",
    uwvContactPhone: null,
    uwvContactEmail: null,
    orderNumber: "ORD-1",
    startDate: "2026-01-01",
    planOfAction: null,
    maxHours: 30,
    maxAdminHours: 10,
    createdAtUnixMs: 1,
    updatedAtUnixMs: 1,
  }
}

function createOrganizationSettings(): OrganizationSettings {
  return {
    practiceName: "Coachscribe",
    website: "https://example.test",
    visitAddress: "Straat 1",
    postalAddress: "Postbus 1",
    postalCodeCity: "1234AB Amsterdam",
    tintColor: "#BE0165",
    logoDataUrl: null,
    updatedAtUnixMs: 1,
  }
}

function createUserSettings(): UserSettings {
  return {
    contactName: "Coach",
    contactRole: "Coach",
    contactPhone: "0612345678",
    contactEmail: "coach@example.com",
    updatedAtUnixMs: 1,
  }
}

test("generateStructuredReport leaves AI answers empty when there is no supporting evidence", async () => {
  await withDisabledAzureDeployments(async () => {
    const template = readSupportedUwvTemplate("reintegratieplan_werkfit_maken")
    const generated = await generateStructuredReport({
      template,
      client: createClient(),
      trajectory: createTrajectory(),
      organizationSettings: createOrganizationSettings(),
      userSettings: createUserSettings(),
      evidenceByFieldId: new Map<string, string[]>(),
    })

    assert.equal(generated.structuredReport.fields.rp_werkfit_1_1.answer, "Jan Jansen")
    assert.equal(generated.structuredReport.fields.rp_werkfit_5_1.answer, "")
    assert.equal(generated.structuredReport.fields.rp_werkfit_7_1.answer, "")
    assert.equal(generated.structuredReport.fields.rp_werkfit_8_3.answer, "")
  })
})

test("createTemplateFieldIdResolver maps model variants to canonical fieldId", () => {
  const template = readSupportedUwvTemplate("reintegratieplan_werkfit_maken")
  const resolve = createTemplateFieldIdResolver(template)
  assert.equal(resolve("rp_werkfit_5_1"), "rp_werkfit_5_1")
  assert.equal(resolve("RP_WERKFIT_5_1"), "rp_werkfit_5_1")
  assert.equal(resolve("fieldId=rp_werkfit_5_1"), "rp_werkfit_5_1")
  assert.equal(resolve("5.1"), "rp_werkfit_5_1")
  assert.equal(resolve("5_1"), "rp_werkfit_5_1")
  assert.equal(resolve("veld 5.1 activiteiten"), "rp_werkfit_5_1")
  assert.equal(resolve("onbekend"), "")
})

test("template AI metadata contains detailed question contract", () => {
  const template = readSupportedUwvTemplate("eindrapportage_werkfit_maken")
  const fields = listAiTemplateFields(template)
  const er42 = fields.find((field) => field.fieldId === "er_werkfit_4_2")
  assert.ok(er42?.aiConfig)
  assert.equal(er42?.aiConfig?.antwoordType, "multiple_choice")
  assert.equal(er42?.aiConfig?.opties?.length, 3)
  assert.ok((er42?.aiConfig?.skipLogica || []).length >= 2)
})
