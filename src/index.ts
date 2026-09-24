import crypto from "crypto"
import { Worker, WebhookVerificationError } from "@notionhq/workers"
import { j } from "@notionhq/workers/schema-builder"
import { config } from "./config.js"
import { generateGeminiText, testGeminiAuthentication } from "./gemini.js"
import { buildLeadershipCalendarLink } from "./leadership-calendar.js"
import { addDays, createReportPage, readActivities, readLeadershipCalendar, validateDateOnly } from "./notion.js"
import { buildReportPrompt } from "./report-guide.js"
import { calculateScheduledReportPeriod } from "./schedule.js"
import { sendWeeklyReportFailureNotification, sendWeeklyReportNotification } from "./telegram.js"
const worker = new Worker()
export default worker
function displayDate(dateOnly: string) { const [, month, day] = dateOnly.split("-"); return `${day}/${month}` }
async function collectEvidence(notion: any, startDate: string, endDate: string) {
  const start = validateDateOnly(startDate), end = validateDateOnly(endDate)
  if (start > end) throw new Error("startDate must not be after endDate")
  const calendarStart = addDays(end, 2), calendarEnd = addDays(end, 7)
  const [activities, leadershipEvents] = await Promise.all([readActivities(notion, start, end), readLeadershipCalendar(notion, calendarStart, calendarEnd)])
  const evidence = { reportPeriod: { startDate: start, endDate: end }, nextPeriod: { startDate: calendarStart, endDate: calendarEnd }, source: { database: "Activities", dataSourceId: config.activitiesDataSourceId }, totalActivities: activities.length, activities, leadershipCalendar: { startDate: calendarStart, endDate: calendarEnd, totalEvents: leadershipEvents.length, events: leadershipEvents } }
  return { start, end, calendarStart, calendarEnd, activities, leadershipEvents, evidence, evidenceJson: JSON.stringify(evidence, null, 2) }
}
function cleanReportMarkdown(markdown: string) {
  const blocked = [/Trạng thái được phân loại dựa trên Activity Outcome/i, /Positive\s*(?:→|➔|->)\s*\*{0,2}Healthy/i, /Neutral\s*\/\s*Waiting.*(?:→|➔|->).*Watch/i, /Negative\s*(?:→|➔|->)\s*\*{0,2}At Risk/i]
  return markdown.split(/\r?\n/).filter((line) => !blocked.some((pattern) => pattern.test(line.replace(/<[^>]+>/g, "")))).join("\n").replace(/\n{3,}/g, "\n\n").trim()
}
async function generateReport(notion: any, startDate: string, endDate: string) {
  const result = await collectEvidence(notion, startDate, endDate), title = `Tuần ${displayDate(result.start)} - ${displayDate(result.end)} (demo)`, startedAt = new Date().toISOString()
  try {
    const generated = await generateGeminiText(buildReportPrompt(result.evidenceJson, result.start, result.end), "Bạn chịu trách nhiệm toàn bộ báo cáo, gồm phân tích Activities và tóm tắt lịch Lãnh đạo tuần kế tiếp. Không in chú giải phân loại Opportunity Health và không tạo bảng lịch.")
    const reportMarkdown = cleanReportMarkdown(generated.output)
    if (!reportMarkdown) throw new Error("Gemini returned empty report content")
    const calendarLink = buildLeadershipCalendarLink(config.leadershipCalendarViewUrl)
    const page = await createReportPage(notion, title, `${reportMarkdown}\n\n${calendarLink}`)
    let notificationSent = false
    try { notificationSent = await sendWeeklyReportNotification(process.env.TELEGRAM_BOT_TOKEN ?? "", process.env.TELEGRAM_CHAT_ID ?? "", result.start, result.end, page.url ?? null) } catch (error) { console.error("Failed to send Telegram notification:", error instanceof Error ? error.message : String(error)) }
    return { status: "completed", pageId: page.id, pageUrl: page.url ?? null, startDate: result.start, endDate: result.end, totalActivities: result.activities.length, calendarStartDate: result.calendarStart, calendarEndDate: result.calendarEnd, totalLeadershipEvents: result.leadershipEvents.length, startedAt, completedAt: new Date().toISOString(), notificationSent, geminiModel: generated.model, geminiAttempt: generated.attempt, geminiOutputInsertedUnchanged: false, calendarAppendedByWorker: false, calendarLinkAppendedByWorker: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    try {
      await sendWeeklyReportFailureNotification(
        process.env.TELEGRAM_BOT_TOKEN ?? "",
        process.env.TELEGRAM_CHAT_ID ?? "",
        result.start,
        result.end,
        result.activities.length,
        result.leadershipEvents.length,
        message,
      )
    } catch (telegramError) {
      console.error("Failed to send Telegram failure notification:", telegramError instanceof Error ? telegramError.message : String(telegramError))
    }
    throw error
  }
}
function verifyScheduledWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>) {
  const secret = process.env.WORKER_WEBHOOK_SECRET
  if (!secret) throw new WebhookVerificationError("WORKER_WEBHOOK_SECRET not configured")
  const rawSignature = headers["x-weekly-report-signature"], signature = Array.isArray(rawSignature) ? rawSignature[0] : rawSignature
  if (!signature?.startsWith("sha256=")) throw new WebhookVerificationError("Missing scheduled report signature")
  const expected = `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new WebhookVerificationError("Invalid scheduled report signature")
}
worker.tool("prepareActivitiesJson", { title: "Prepare Activities and leadership calendar JSON", description: "Read Activities for the report period and leadership events for the following week.", schema: j.object({ startDate: j.string(), endDate: j.string() }), hints: { readOnlyHint: true }, execute: async ({ startDate, endDate }, { notion }) => { const result = await collectEvidence(notion, startDate, endDate); return { evidence: result.evidence, evidenceJson: result.evidenceJson, leadershipCalendar: { startDate: result.calendarStart, endDate: result.calendarEnd, totalEvents: result.leadershipEvents.length, events: result.leadershipEvents }, calendarLink: buildLeadershipCalendarLink(config.leadershipCalendarViewUrl) } } })
worker.tool("generateSalesReport", { title: "Generate sales report with Gemini", description: "Generate a report for a requested date range and append the following week's leadership calendar.", schema: j.object({ startDate: j.string(), endDate: j.string() }), execute: async ({ startDate, endDate }, { notion }) => generateReport(notion, startDate, endDate) })
worker.webhook("scheduledWeeklyReport", { title: "Scheduled weekly sales report", description: "Authenticated webhook called by GitHub Actions to generate the configured weekly report.", execute: async (events, { notion }) => { for (const event of events) { verifyScheduledWebhook(event.rawBody, event.headers); const period = calculateScheduledReportPeriod(); await generateReport(notion, period.startDate, period.endDate) } } })
worker.tool("testGeminiConnection", { title: "Test Gemini connection", description: "Verify the configured Gemini API key and network connection.", schema: j.object({}), hints: { readOnlyHint: true }, execute: async () => testGeminiAuthentication() })
