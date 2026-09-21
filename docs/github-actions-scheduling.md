# GitHub Actions scheduling

## Mặc định

- Trigger: 06:00 sáng Chủ nhật, giờ Việt Nam.
- GitHub cron: `0 23 * * 6` vì GitHub dùng UTC.
- Data window: thứ Hai đến thứ Bảy gần nhất.

## Chỗ chỉnh cấu hình

- Giờ/ngày trigger: `.github/workflows/weekly-report.yml`.
- Ngày bắt đầu/kết thúc kỳ báo cáo: `src/schedule-config.ts`.

## GitHub Actions secrets

- `WORKER_WEBHOOK_URL`: URL của `scheduledWeeklyReport`, lấy bằng `ntn workers webhooks list`.
- `WORKER_WEBHOOK_SECRET`: cùng giá trị đang lưu trong Worker.

Có thể chạy thử bằng Actions → Generate weekly sales report → Run workflow.
