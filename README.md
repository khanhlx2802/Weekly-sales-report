# Weekly Sales Report Worker

Notion Worker đọc Activities theo kỳ báo cáo, gửi JSON cùng Writing Guide cho Gemini, rồi tạo báo cáo trong Notion. GitHub Actions gọi webhook có chữ ký HMAC để chạy tự động.

## Capabilities

- `prepareActivitiesJson`: đọc và chuẩn hóa Activities theo khoảng ngày.
- `generateSalesReport`: chạy thủ công với `startDate` và `endDate`.
- `scheduledWeeklyReport`: webhook dành cho GitHub Actions.
- `testGeminiConnection`: kiểm tra kết nối Gemini.

## Mặc định

- Lịch chạy: 06:00 sáng Chủ nhật, giờ Việt Nam.
- Kỳ dữ liệu: thứ Hai đến thứ Bảy gần nhất.
- Chỉnh ngày tại `src/schedule-config.ts`.
- Chỉnh giờ tại `.github/workflows/weekly-report.yml`.

## Secrets 

Worker: `NOTION_API_TOKEN`, `GEMINI_API_KEY`, `WORKER_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
GitHub Actions: `WORKER_WEBHOOK_URL`, `WORKER_WEBHOOK_SECRET`.

## Kiểm tra và deploy

```bash
npm install
npm run check
ntn workers deploy --json
ntn workers webhooks list
```

Không commit token thật vào repository.
