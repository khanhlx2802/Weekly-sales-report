import crypto from "crypto"
import { Worker, WebhookVerificationError } from "@notionhq/workers"
import { j } from "@notionhq/workers/schema-builder"
import { config } from "./config.js"
import { buildLeadershipCalendarSection } from "./leadership-calendar.js"
import { addDays, createReportPage, readActivities, readLeadershipCalendar, validateDateOnly } from "./notion.js"
import { calculateScheduledReportPeriod } from "./schedule.js"
import { sendWeeklyReportNotification } from "./telegram.js"
import { buildWorkerReport } from "./worker-report.js"

const worker = new Worker()
export default worker
function displayDate(dateOnly: string) { const [, month, day] = dateOnly.split("-"); return `${day}/${month}` }
async function collectEvidence(notion: any, startDate: string, endDate: string) {
  const start = validateDateOnly(startDate), end = validateDateOnly(endDate)
  if (start > end) throw new Error("startDate must not be after endDate")
  const calendarStart = addDays(end, 2), calendarEnd = addDays(end, 7)
  const [activities, leadershipEvents] = await Promise.all([
    readActivities(notion, start, end),
    readLeadershipCalendar(notion, calendarStart, calendarEnd),
  ])
  const evidence = {
    reportPeriod: { startDate: start, endDate: end },
    nextPeriod: { startDate: calendarStart, endDate: calendarEnd },
    sources: {
      activities: config.activitiesDataSourceId,
      leadershipCalendar: config.leadershipCalendarDataSourceId,
    },
    totalActivities: activities.length,
    totalLeadershipEvents: leadershipEvents.length,
    activities,
    leadershipEvents,
  }
  return { start, end, calendarStart, calendarEnd, activities, leadershipEvents, evidence, evidenceJson: JSON.stringify(evidence, null, 2) }
}
async function generateReport(notion: any, startDate: string, endDate: string) {
  const result = await collectEvidence(notion, startDate, endDate)
  const title = `Tuần ${displayDate(result.start)} - ${displayDate(result.end)} (Worker demo)`
  const startedAt = new Date().toISOString()
  const reportMarkdown = buildWorkerReport(result.activities, result.start, result.end)
  const calendarMarkdown = buildLeadershipCalendarSection(result.leadershipEvents, result.calendarStart, result.calendarEnd, config.leadershipCalendarViewUrl)
  const page = await createReportPage(notion, title, `${reportMarkdown}\n\n---\n\n${calendarMarkdown}`)
  let notificationSent = false
  try {
    notificationSent = await sendWeeklyReportNotification(process.env.TELEGRAM_BOT_TOKEN ?? "", process.env.TELEGRAM_CHAT_ID ?? "", result.start, result.end, page.url ?? null)
  } catch (error) { console.error("Failed to send Telegram notification:", error instanceof Error ? error.message : String(error)) }
  return {
    status: "completed", author: "notion-worker", externalAiUsed: false,
    pageId: page.id, pageUrl: page.url ?? null,
    startDate: result.start, endDate: result.end, totalActivities: result.activities.length,
    calendarStartDate: result.calendarStart, calendarEndDate: result.calendarEnd,
    totalLeadershipEvents: result.leadershipEvents.length,
    startedAt, completedAt: new Date().toISOString(), notificationSent,
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
worker.tool("prepareActivitiesJson", {
  title: "Prepare Notion report evidence",
  description: "Read Activities and the following week's leadership calendar directly from Notion.",
  schema: j.object({ startDate: j.string(), endDate: j.string() }), hints: { readOnlyHint: true },
  execute: async ({ startDate, endDate }, { notion }) => { const result = await collectEvidence(notion, startDate, endDate); return { evidence: result.evidence, evidenceJson: result.evidenceJson } },
})
worker.tool("generateSalesReport", {
  title: "Generate report with Notion Worker",
  description: "Generate a deterministic weekly report using only Notion data and Worker code.",
  schema: j.object({ startDate: j.string(), endDate: j.string() }),
  execute: async ({ startDate, endDate }, { notion }) => generateReport(notion, startDate, endDate),
})
worker.webhook("scheduledWeeklyReport", {
  title: "Scheduled weekly sales report",
  description: "Authenticated webhook called by GitHub Actions to generate the configured weekly report.",
  execute: async (events, { notion }) => { for (const event of events) { verifyScheduledWebhook(event.rawBody, event.headers); const period = calculateScheduledReportPeriod(); await generateReport(notion, period.startDate, period.endDate) } },
})
