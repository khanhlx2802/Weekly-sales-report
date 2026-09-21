import { config } from "./config.js"

const retryableStatuses = new Set([429, 500, 502, 503, 504])
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function extractText(payload: any): string {
  if (typeof payload?.output_text === "string") return payload.output_text
  if (typeof payload?.text === "string") return payload.text
  const texts: string[] = []
  for (const step of payload?.steps ?? []) {
    for (const item of step?.content ?? []) if (typeof item?.text === "string") texts.push(item.text)
  }
  for (const candidate of payload?.candidates ?? []) {
    for (const part of candidate?.content?.parts ?? []) if (typeof part?.text === "string") texts.push(part.text)
  }
  for (const output of payload?.outputs ?? []) {
    for (const item of output?.content ?? []) if (typeof item?.text === "string") texts.push(item.text)
  }
  return texts.join("\n").trim()
}

export async function generateGeminiText(prompt: string, systemInstruction: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= config.geminiMaxAttempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), config.geminiAttemptTimeoutMs)
    try {
      const response = await fetch(config.geminiEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ model: config.geminiModel, input: `${systemInstruction}\n\n${prompt}` }),
        signal: controller.signal,
      })
      const raw = await response.text()
      const payload = raw ? JSON.parse(raw) : {}
      if (!response.ok) {
        const error = new Error(`Gemini request failed (${response.status}): ${raw}`)
        if (!retryableStatuses.has(response.status) || attempt === config.geminiMaxAttempts) throw error
        lastError = error
      } else {
        const output = extractText(payload)
        if (!output) throw new Error("Gemini returned empty report content")
        return output
      }
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error))
      lastError = normalized
      if (attempt === config.geminiMaxAttempts) throw normalized
    } finally {
      clearTimeout(timeout)
    }
    await sleep(config.geminiRetryDelayMs)
  }
  throw lastError ?? new Error("Gemini request failed")
}

export async function testGeminiAuthentication() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured")
  const response = await fetch(config.geminiAuthEndpoint, { headers: { "x-goog-api-key": apiKey } })
  const body = await response.text()
  if (!response.ok) throw new Error(`Gemini authentication failed (${response.status}): ${body}`)
  return { connected: true, model: config.geminiModel }
}
