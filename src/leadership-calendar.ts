import { addDays } from "./notion.js"

type CalendarEvent = Record<string, any>
const weekdays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
function displayDate(dateOnly: string) { const [, month, day] = dateOnly.split("-"); return `${day}/${month}` }
function escapeCell(value: unknown) { return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() }
function timeLabel(value: string | undefined) {
  if (!value || /^\d{4}-\d{2}-\d{2}$/.test(value)) return "Cả ngày"
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value))
}
function eventCell(event: CalendarEvent) {
  const title = escapeCell(event["Sự kiện"] || "Sự kiện chưa đặt tên"), pageUrl = typeof event.url === "string" ? event.url : ""
  const leaders = Array.isArray(event["Lãnh đạo"]) ? event["Lãnh đạo"].map((person: any) => person?.name).filter(Boolean).join(", ") : ""
  const when = event["Thời gian"]?.start as string | undefined, status = escapeCell(event["Trạng thái"] || ""), location = escapeCell(event["Địa điểm"] || "")
  const lines = [`**${timeLabel(when)} · ${pageUrl ? `[${title}](${pageUrl})` : title}**`]
  if (leaders) lines.push(`👤 ${escapeCell(leaders)}`)
  if (status) lines.push(`🏷️ ${status}`)
  if (location) lines.push(`📍 ${location}`)
  return lines.join("<br>")
}
export function buildLeadershipCalendarSection(events: CalendarEvent[], startDate: string, endDate: string, liveViewUrl: string) {
  const dates = weekdays.map((_, index) => addDays(startDate, index))
  const cells = dates.map((date) => { const matches = events.filter((event) => String(event["Thời gian"]?.start ?? "").slice(0, 10) === date); return matches.length ? matches.map(eventCell).join("<br><br>") : "—" })
  return [`#### 📅 Lịch tuần Lãnh đạo · ${displayDate(startDate)}–${displayDate(endDate)}`, "", `| ${dates.map((date, index) => `${weekdays[index]}<br>${displayDate(date)}`).join(" | ")} |`, `| ${dates.map(() => "---").join(" | ")} |`, `| ${cells.join(" | ")} |`, "", `[👑 Mở Calendar live](${liveViewUrl})`].join("\n")
}
