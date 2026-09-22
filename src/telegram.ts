const TELEGRAM_TIMEOUT_MS = 10_000

export async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<boolean> {
  if (!botToken.trim() || !chatId.trim()) return false

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Telegram API error (${response.status}): ${body}`)
    }

    const payload = await response.json()
    return payload?.ok === true
  } finally {
    clearTimeout(timeout)
  }
}

export async function sendWeeklyReportNotification(
  botToken: string,
  chatId: string,
  startDate: string,
  endDate: string,
  pageUrl?: string | null,
): Promise<boolean> {
  const message = [
    `✅ *Tạo báo cáo Sales Weekly thành công*`,
    ``,
    `📅 Kỳ báo cáo: ${startDate} — ${endDate}`,
    ...(pageUrl ? [`🔗 Report: ${pageUrl}`] : []),
  ].join("\n")

  return sendTelegramMessage(botToken, chatId, message)
}