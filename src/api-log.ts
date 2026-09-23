export type ApiLogStatus = "SUCCESS" | "FAILED"

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message
    .replace(/([?&](?:key|api_key|token)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/(Bearer\s+)[A-Za-z0-9._~-]+/gi, "$1[REDACTED]")
    .slice(0, 1000)
}

export async function runLoggedApi<T>(apiName: string, operation: () => Promise<T>): Promise<T> {
  const timestamp = new Date().toISOString()
  const started = Date.now()
  try {
    const result = await operation()
    console.log(JSON.stringify({ type: "api_log", timestamp, apiName, status: "SUCCESS" as ApiLogStatus, durationMs: Date.now() - started }))
    return result
  } catch (error) {
    console.error(JSON.stringify({ type: "api_log", timestamp, apiName, status: "FAILED" as ApiLogStatus, durationMs: Date.now() - started, error: safeError(error) }))
    throw error
  }
}
