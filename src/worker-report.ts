type Activity = Record<string, any>

function esc(value: unknown) {
  return String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim()
}
function dateOf(activity: Activity) {
  const value = activity.Date?.start ?? activity.Date ?? ""
  if (!value) return "—"
  const date = String(value).slice(0, 10).split("-")
  return date.length === 3 ? `${date[2]}/${date[1]}` : esc(value)
}
function titleOf(activity: Activity) {
  return esc(activity.Activities || activity.Name || "Hoạt động chưa đặt tên")
}
function peopleOf(activity: Activity) {
  const people = activity["Who did this activity?"]
  if (!Array.isArray(people)) return "—"
  return people.map((person: any) => person?.name).filter(Boolean).join(", ") || "—"
}
function relationshipOf(activity: Activity) {
  return esc(activity.Relationship || "Chưa phân loại")
}
function outcomeOf(activity: Activity) {
  return esc(activity["Activity Outcome"] || "Chưa cập nhật")
}
function healthOf(outcome: string) {
  const value = outcome.toLowerCase()
  if (value.includes("positive") || value.includes("tích cực") || value.includes("success")) return "🟢 Healthy"
  if (value.includes("negative") || value.includes("tiêu cực") || value.includes("fail")) return "🔴 At Risk"
  return "🟡 Watch"
}
function countBy(items: Activity[], getter: (item: Activity) => string) {
  const counts = new Map<string, number>()
  for (const item of items) {
    const key = getter(item) || "Chưa cập nhật"
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}
function bullets(items: Activity[], emptyText: string, mapper: (item: Activity) => string) {
  if (!items.length) return `- ${emptyText}`
  return items.map(mapper).join("\n")
}

export function buildWorkerReport(activities: Activity[], startDate: string, endDate: string) {
  const relationships = countBy(activities, relationshipOf)
  const outcomes = countBy(activities, outcomeOf)
  const healthy = activities.filter((item) => healthOf(outcomeOf(item)).includes("Healthy"))
  const watch = activities.filter((item) => healthOf(outcomeOf(item)).includes("Watch"))
  const risks = activities.filter((item) => healthOf(outcomeOf(item)).includes("At Risk"))
  const nextSteps = activities.filter((item) => esc(item["Next Step"]))
  const reportStart = startDate.split("-").reverse().slice(0, 2).join("/")
  const reportEnd = endDate.split("-").reverse().slice(0, 2).join("/")

  const overviewRows = [
    `| Tổng Activities | ${activities.length} |`,
    ...relationships.map(([name, count]) => `| ${esc(name)} | ${count} |`),
    ...outcomes.map(([name, count]) => `| Outcome: ${esc(name)} | ${count} |`),
  ].join("\n")

  const healthRows = activities.map((activity) => {
    const nextStep = esc(activity["Next Step"] || "—")
    const pageLink = activity.url ? `[${titleOf(activity)}](${activity.url})` : titleOf(activity)
    return `| ${dateOf(activity)} | ${pageLink} | ${relationshipOf(activity)} | ${healthOf(outcomeOf(activity))} | ${outcomeOf(activity)} | ${nextStep} |`
  }).join("\n")

  return [
    `#### 📌 Tổng quan nhanh · ${reportStart}–${reportEnd}`,
    "",
    "Báo cáo được Notion Worker tổng hợp trực tiếp từ database Activities. Không sử dụng Gemini hoặc mô hình AI bên ngoài.",
    "",
    "| Chỉ số | Số lượng |",
    "| --- | ---: |",
    overviewRows,
    "",
    "#### 🚦 Opportunity Health",
    "",
    "| Ngày | Hoạt động | Quan hệ | Health | Outcome | Next Step |",
    "| --- | --- | --- | --- | --- | --- |",
    healthRows || "| — | Không có hoạt động | — | — | — | — |",
    "",
    "#### ⭐ Các diễn biến tích cực",
    "",
    bullets(healthy, "Không có hoạt động Positive trong kỳ.", (activity) => `- **${dateOf(activity)} · ${titleOf(activity)}** — ${esc(activity.Description || "Không có mô tả")}`),
    "",
    "#### ⚠️ Cần chú ý / rủi ro",
    "",
    bullets([...risks, ...watch], "Không ghi nhận hoạt động cần chú ý.", (activity) => `- **${healthOf(outcomeOf(activity))} · ${titleOf(activity)}** — Outcome: ${outcomeOf(activity)}; Next step: ${esc(activity["Next Step"] || "Chưa cập nhật")}`),
    "",
    "#### 🎯 Trọng tâm tuần tới",
    "",
    bullets(nextSteps, "Chưa có Next Step được cập nhật trong Activities.", (activity) => `- [ ] **${titleOf(activity)}** — ${esc(activity["Next Step"])} · Phụ trách: ${peopleOf(activity)}`),
    "",
    "#### 📚 Chi tiết theo người thực hiện",
    "",
    "| Ngày | Hoạt động | Người thực hiện | Quan hệ | Outcome |",
    "| --- | --- | --- | --- | --- |",
    activities.map((activity) => `| ${dateOf(activity)} | ${titleOf(activity)} | ${peopleOf(activity)} | ${relationshipOf(activity)} | ${outcomeOf(activity)} |`).join("\n") || "| — | Không có dữ liệu | — | — | — |",
  ].join("\n")
}
