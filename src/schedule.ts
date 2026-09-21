import { addDays } from "./notion.js"
import { scheduleConfig, type Weekday } from "./schedule-config.js"

const weekdayIndexes: Record<Weekday, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6,
}

function dateInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function weekdayOf(dateOnly: string) {
  return new Date(`${dateOnly}T00:00:00Z`).getUTCDay()
}

export function calculateScheduledReportPeriod(now = new Date()) {
  const today = dateInTimeZone(now, scheduleConfig.triggerTimeZone)
  const todayIndex = weekdayOf(today)
  const endIndex = weekdayIndexes[scheduleConfig.reportEndDay]
  const startIndex = weekdayIndexes[scheduleConfig.reportStartDay]
  const daysSinceEnd = (todayIndex - endIndex + 7) % 7
  let endDate = addDays(today, -daysSinceEnd)
  endDate = addDays(endDate, scheduleConfig.weekOffset * 7)
  const periodLength = (endIndex - startIndex + 7) % 7
  const startDate = addDays(endDate, -periodLength)
  return { startDate, endDate, timeZone: scheduleConfig.triggerTimeZone }
}
