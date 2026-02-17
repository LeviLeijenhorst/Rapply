import { env } from "../env"
import { generateSummaryWithAzureOpenAi } from "./azureOpenAiSummary"

type GenerateSummaryParams = {
  transcript: string
  template?: { name: string; sections: { title: string; description: string }[] }
}

// Intent: generateSummary
export async function generateSummary(params: GenerateSummaryParams): Promise<string> {
  const azureConfigured = !!String(env.azureOpenAiSummaryDeployment || "").trim()

  if (azureConfigured) {
    return await generateSummaryWithAzureOpenAi(params)
  }

  throw new Error("Azure OpenAI summary deployment is not configured")
}
