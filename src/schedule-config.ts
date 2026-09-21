export const scheduleConfig = {
  // GitHub Actions chạy lúc 06:00 sáng Chủ nhật theo giờ Việt Nam.
  // Cron thực tế nằm trong .github/workflows/weekly-report.yml và dùng UTC.
  triggerTimeZone: "Asia/Ho_Chi_Minh",
  triggerDay: "SUNDAY",
  triggerHour: 6,
  triggerMinute: 0,

  // Khoảng dữ liệu mặc định: từ thứ Hai đến hết thứ Bảy gần nhất.
  reportStartDay: "MONDAY",
  reportEndDay: "SATURDAY",

  // 0 = khoảng gần nhất vừa kết thúc; -1 = lùi thêm một tuần.
  weekOffset: 0,
} as const

export type Weekday = "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY"
