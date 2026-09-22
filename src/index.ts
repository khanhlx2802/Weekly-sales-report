import crypto from "crypto"
import { Worker, WebhookVerificationError } from "@notionhq/workers"
import { j } from "@notionhq/workers/schema-builder"
import { config } from "./config.js"
import { generateGeminiText, testGeminiAuthentication } from "./gemini.js"
import { addDays, createReportPage, readActivities, validateDateOnly } from "./notion.js"
import { buildReportPrompt } from "./report-guide.js"
import { calculateScheduledReportPeriod } from "./schedule.js"
import { sendWeeklyReportNotification } from "./telegram.js"

const worker = new Worker()
export default worker

function displayDate(dateOnly: string) {
  const [, month, day] = dateOnly.split("-")
  return `${day}/${month}`
}

async function collectEvidence(notion: any, startDate: string, endDate: string) {
  const start = validateDateOnly(startDate)
  const end = validateDateOnly(endDate)
  if (start > end) throw new Error("startDate must not be after endDate")
  const activities = await readActivities(notion, start, end)
  const evidence = {
    reportPeriod: { startDate: start, endDate: end },
    nextPeriod: { startDate: addDays(end, 2), endDate: addDays(end, 7) },
    source: { database: "Activities", dataSourceId: config.activitiesDataSourceId },
    totalActivities: activities.length,
    activities,
  }
  return { start, end, activities, evidence, evidenceJson: JSON.stringify(evidence, null, 2) }
}

async function generateReport(notion: any, startDate: string, endDate: string) {
  const result = await collectEvidence(notion, startDate, endDate)
  const title = `Tuần ${displayDate(result.start)} - ${displayDate(result.end)} (demo)`
  const startedAt = new Date().toISOString()
  try {
    const reportMarkdown = await generateGeminiText(
      buildReportPrompt(result.evidenceJson, result.start, result.end),
      "Bạn chịu trách nhiệm hoàn toàn về phân tích, nội dung, cấu trúc và định dạng của báo cáo. Output sẽ được chèn nguyên văn vào Notion.",
    )
    if (!reportMarkdown.trim()) throw new Error("Gemini returned empty report content")
    const page = await createReportPage(notion, title, reportMarkdown)
    let notificationSent = false
    try {
      notificationSent = await sendWeeklyReportNotification(
        process.env.TELEGRAM_BOT_TOKEN ?? "",
        process.env.TELEGRAM_CHAT_ID ?? "",
        result.start,
        result.end,
        page.url ?? null,
      )
    } catch (error) {
      console.error("Failed to send Telegram notification:", error instanceof Error ? error.message : String(error))
    }
    return {
      status: "completed", pageId: page.id, pageUrl: page.url ?? null,
      startDate: result.start, endDate: result.end, totalActivities: result.activities.length,
      startedAt, completedAt: new Date().toISOString(), notificationSent, outputInsertedUnchanged: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    try {
      await createReportPage(notion, `${title} — Failed`, `#### ❌ Tạo báo cáo thất bại\n\n- Kỳ dữ liệu: ${result.start} đến ${result.end}\n- Activities đã đọc: ${result.activities.length}\n- Lỗi: ${message}`)
    } catch {}
    throw error
  }
}

function verifyScheduledWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>) {
  const secret = process.env.WORKER_WEBHOOK_SECRET
  if (!secret) throw new WebhookVerificationError("WORKER_WEBHOOK_SECRET not configured")
  const rawSignature = headers["x-weekly-report-signature"]
  const signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature
  if (!signature?.startsWith("sha256=")) throw new WebhookVerificationError("Missing scheduled report signature")
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new WebhookVerificationError("Invalid scheduled report signature")
  }
}

worker.tool("prepareActivitiesJson", {
  title: "Prepare Activities JSON",
  description: "Read Activities between a requested start and end date and return normalized JSON evidence.",
  schema: j.object({ startDate: j.string(), endDate: j.string() }),
  hints: { readOnlyHint: true },
  execute: async ({ startDate, endDate }, { notion }) => {
    const result = await collectEvidence(notion, startDate, endDate)
    return { evidence: result.evidence, evidenceJson: result.evidenceJson }
  },
})

worker.tool("generateSalesReport", {
  title: "Generate sales report with Gemini",
  description: "Manually generate a report for a requested date range.",
  schema: j.object({ startDate: j.string(), endDate: j.string() }),
  execute: async ({ startDate, endDate }, { notion }) => generateReport(notion, startDate, endDate),
})

worker.webhook("scheduledWeeklyReport", {
  title: "Scheduled weekly sales report",
  description: "Authenticated webhook called by GitHub Actions to generate the configured weekly report.",
  execute: async (events, { notion }) => {
    for (const event of events) {
      verifyScheduledWebhook(event.rawBody, event.headers)
      const period = calculateScheduledReportPeriod()
      await generateReport(notion, period.startDate, period.endDate)
    }
  },
})

worker.tool("testGeminiConnection", {
  title: "Test Gemini connection",
  description: "Verify the configured Gemini API key and network connection.",
  schema: j.object({}),
  hints: { readOnlyHint: true },
  execute: async () => testGeminiAuthentication(),
})
