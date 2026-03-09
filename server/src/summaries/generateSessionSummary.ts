import { env } from "../env"
import { generateSessionSummaryWithAzureOpenAi } from "./generateSessionSummaryWithAzureOpenAi"

type GenerateSessionSummaryParams = {
  transcript: string
  template?: { name: string; sections: { title: string; description: string }[] }
  responseMode?: "markdown" | "structured_item_summary"
}

export async function generateSessionSummary(params: GenerateSessionSummaryParams): Promise<string> {
  const azureConfigured = !!String(env.azureOpenAiSummaryDeployment || "").trim()
  if (azureConfigured) {
    return await generateSessionSummaryWithAzureOpenAi(params)
  }
  throw new Error("Azure OpenAI summary deployment is not configured")
}
