export async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<boolean> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Telegram API error (${response.status}): ${body}`)
  }

  const payload = await response.json()
  return payload?.ok === true
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