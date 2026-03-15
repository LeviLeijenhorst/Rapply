import assert from "node:assert/strict"
import test from "node:test"
import { env } from "../env"
import { readSummaryDeployment } from "./generateSummary"

test("readSummaryDeployment prefers summary deployment", () => {
  const previousSummaryDeployment = env.azureOpenAiSummaryDeployment
  const previousChatDeployment = env.azureOpenAiChatDeployment

  try {
    env.azureOpenAiSummaryDeployment = "summary-deployment"
    env.azureOpenAiChatDeployment = "chat-deployment"
    assert.equal(readSummaryDeployment(), "summary-deployment")
  } finally {
    env.azureOpenAiSummaryDeployment = previousSummaryDeployment
    env.azureOpenAiChatDeployment = previousChatDeployment
  }
})

test("readSummaryDeployment falls back to chat deployment when summary deployment is empty", () => {
  const previousSummaryDeployment = env.azureOpenAiSummaryDeployment
  const previousChatDeployment = env.azureOpenAiChatDeployment

  try {
    env.azureOpenAiSummaryDeployment = ""
    env.azureOpenAiChatDeployment = "chat-deployment"
    assert.equal(readSummaryDeployment(), "chat-deployment")
  } finally {
    env.azureOpenAiSummaryDeployment = previousSummaryDeployment
    env.azureOpenAiChatDeployment = previousChatDeployment
  }
})
