import { runLoggedApi } from "./api-log.js"
import { config } from "./config.js"

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text
  if (typeof payload?.text === "string") return payload.text
  const texts: string[] = []
  for (const step of payload?.steps ?? []) for (const item of step?.content ?? []) if (typeof item?.text === "string") texts.push(item.text)
  for (const candidate of payload?.candidates ?? []) for (const part of candidate?.content?.parts ?? []) if (typeof part?.text === "string") texts.push(part.text)
  for (const output of payload?.outputs ?? []) for (const item of output?.content ?? []) if (typeof item?.text === "string") texts.push(item.text)
  return texts.join("\n").trim()
}

export async function generateGeminiText(prompt: string, systemInstruction: string) {
  return runLoggedApi("Gemini Generate", async () => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.geminiAttemptTimeoutMs)
    try {
      const response = await fetch(config.geminiEndpoint, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": apiKey }, body: JSON.stringify({ model: config.geminiModel, input: `${systemInstruction}\n\n${prompt}` }), signal: controller.signal })
      const raw = await response.text()
      const payload = raw ? JSON.parse(raw) : {}
      if (!response.ok) throw new Error(`Gemini request failed (${response.status}): ${raw}`)
      const output = extractText(payload)
      if (!output) throw new Error("Gemini returned empty report content")
      return output
    } finally { clearTimeout(timeout) }
  })
}

export async function testGeminiAuthentication() {
  return runLoggedApi("Gemini Authentication", async () => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")
    const response = await fetch(config.geminiAuthEndpoint, { headers: { "x-goog-api-key": apiKey } })
    const body = await response.text()
    if (!response.ok) throw new Error(`Gemini authentication failed (${response.status}): ${body}`)
    return { connected: true, model: config.geminiModel }
  })
}
