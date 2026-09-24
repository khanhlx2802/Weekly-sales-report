const TIMEOUT = 10_000

export async function sendTelegramMessage(token: string, chatId: string, message: string, parseMode: "Markdown" | undefined = "Markdown") {
  if (!token.trim() || !chatId.trim()) return false
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const body: Record<string, unknown> = { chat_id: chatId, text: message }
    if (parseMode) body.parse_mode = parseMode
    const response = await fetch("https:" + "//api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body), signal: controller.signal,
    })
    if (!response.ok) throw new Error(`Telegram API error (${response.status}): ${await response.text()}`)
    return (await response.json())?.ok === true
  } finally { clearTimeout(timeout) }
}

export function sendWeeklyReportNotification(token: string, chatId: string, startDate: string, endDate: string, pageUrl?: string | null) {
  return sendTelegramMessage(token, chatId, ["✅ *Tạo báo cáo Sales Weekly thành công*", "", `📅 Kỳ báo cáo: ${startDate} — ${endDate}`, ...(pageUrl ? [`🔗 Report: ${pageUrl}`] : [])].join("\n"))
}

function describeReportError(message: string) {
  if (/429|rate limit|too_many_requests|quota/i.test(message)) return "Gemini đã hết hoặc chạm giới hạn quota. Worker dừng ngay và không retry lỗi quota ngày."
  if (/503|service_unavailable|high demand/i.test(message)) return "Gemini đang quá tải hoặc tạm thời không khả dụng. Worker đã thử tối đa 2 lần rồi dừng."
  if (/abort|timeout/i.test(message)) return "Gemini phản hồi quá thời gian. Worker đã thử tối đa 2 lần rồi dừng."
  if (/GEMINI_API_KEY/i.test(message)) return "Gemini API key chưa được cấu hình hoặc không hợp lệ."
  return `Worker gặp lỗi: ${message.slice(0, 500)}`
}

export function sendWeeklyReportFailureNotification(token: string, chatId: string, startDate: string, endDate: string, totalActivities: number, totalLeadershipEvents: number, errorMessage: string) {
  return sendTelegramMessage(token, chatId, [
    "❌ Tạo báo cáo Sales Weekly thất bại",
    `📅 Kỳ báo cáo: ${startDate} — ${endDate}`,
    `📊 Activities đã đọc: ${totalActivities}`,
    `🗓️ Lịch lãnh đạo đã đọc: ${totalLeadershipEvents}`,
    `⚠️ ${describeReportError(errorMessage)}`,
    "🛑 Không có báo cáo hoặc thông báo thành công nào được tạo.",
  ].join("\n"), undefined)
}
