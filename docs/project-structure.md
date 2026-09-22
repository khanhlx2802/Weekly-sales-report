# Project Structure - Weekly Sales Report Worker

Mô tả vai trò của từng file và luồng dữ liệu thực tế trong dự án.

## Cấu trúc thư mục

```text
Weekly-sales-report/
├── .env.example
├── .env-telegram                 # Credential local, bị Git ignore
├── package.json
├── package-lock.json
├── README.md
├── tsconfig.json
├── workers.json
├── .github/workflows/
│   └── weekly-report.yml         # Cron và trigger thủ công
├── docs/
│   ├── architecture.md
│   ├── github-actions-scheduling.md
│   └── project-structure.md
├── prompts/
│   └── weekly-report-guide.md
└── src/
    ├── config.ts                 # Notion IDs, Gemini endpoints, retry config
    ├── gemini.ts                 # Gọi Gemini API
    ├── index.ts                  # Worker entry point, tools và webhook
    ├── notion.ts                 # Đọc Activities và tạo report page
    ├── report-guide.ts           # Dựng prompt gửi Gemini
    ├── schedule-config.ts        # Ngày, giờ và timezone lịch chạy
    ├── schedule.ts               # Tính kỳ báo cáo
    └── telegram.ts               # Gửi notification qua Telegram
```

## Root files

### `.env.example`
Template cho các biến môi trường:

- `NOTION_API_TOKEN`
- `GEMINI_API_KEY`
- `WORKER_WEBHOOK_SECRET`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

Không điền secret thật vào file này.

### `.env-telegram`
File local chứa credential Telegram. File được Git ignore và không được commit. Runtime Worker vẫn đọc `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID` từ environment secrets.

### `package.json`, `package-lock.json`, `tsconfig.json`

- Project dùng ESM và TypeScript strict mode.
- Yêu cầu Node.js >= 22 và npm >= 10.9.2.
- `npm run check`: type-check không tạo output.
- `npm run build`: biên dịch `src/` vào `dist/`.
- Dependency runtime chính là `@notionhq/workers`.

### `workers.json`
Cấu hình Notion Worker production gồm workspace ID và worker ID.

### `.github/workflows/weekly-report.yml`
Chạy lúc 23:00 UTC thứ Bảy, tương đương 06:00 Chủ nhật giờ Việt Nam, hoặc qua `workflow_dispatch`. Workflow tạo HMAC-SHA256 từ request body rồi gọi webhook Worker.

## Documentation and prompts

### `docs/architecture.md`
Mô tả luồng GitHub Actions -> Notion Worker -> Notion Activities -> Gemini -> Notion report page -> Telegram, cùng các nhánh lỗi và ranh giới secret.

### `docs/github-actions-scheduling.md`
Giải thích cron UTC, kỳ dữ liệu thứ Hai đến thứ Bảy và hai GitHub Actions secrets cần cấu hình.

### `prompts/weekly-report-guide.md`
Writing Guide quy định Gemini là tác giả duy nhất của báo cáo, không bịa dữ liệu và phải trả về Notion-flavored Markdown với sáu section bắt buộc.

## Source files

### `src/config.ts`
Chứa `activitiesDataSourceId`, `reportParentPageId`, model và endpoint Gemini, timeout 70 giây, retry tối đa 2 lần và delay 5 giây. Notion IDs là resource IDs, không phải secret.

### `src/index.ts`
Khởi tạo Worker và đăng ký:

| Tên | Chức năng |
| --- | --- |
| `prepareActivitiesJson` | Đọc Activities theo ngày và trả evidence JSON; read-only. |
| `generateSalesReport` | Tạo report thủ công từ `startDate` và `endDate`. |
| `scheduledWeeklyReport` | Webhook có HMAC, tự tính kỳ rồi tạo report. |
| `testGeminiConnection` | Kiểm tra Gemini API; read-only. |

Các hàm chính:

- `collectEvidence()`: validate ngày, đọc Activities và đóng gói evidence JSON.
- `generateReport()`: gọi Gemini, tạo page Notion, rồi gửi Telegram. Nếu Gemini hoặc Notion thất bại thì cố tạo page `{title} — Failed`; lỗi Telegram chỉ được log.
- `verifyScheduledWebhook()`: kiểm tra header `x-weekly-report-signature` bằng timing-safe comparison.

### `src/notion.ts`

- Validate ngày `YYYY-MM-DD` và cộng ngày theo UTC.
- Query Data Source hoặc Database theo property `Date`.
- Hỗ trợ pagination với `page_size: 100`.
- Chuẩn hóa title, rich text, date, select, status, people, relation và các property Notion khác.
- Tạo report page dưới `reportParentPageId` bằng Markdown.

### `src/gemini.ts`

- Đọc `GEMINI_API_KEY` từ environment.
- Gửi system instruction và evidence prompt đến Gemini.
- Trích xuất text từ các dạng response khác nhau.
- Retry lỗi `429`, `500`, `502`, `503`, `504`; mỗi lần có timeout 70 giây.
- `testGeminiAuthentication()` kiểm tra API key bằng auth endpoint.

### `src/report-guide.ts`
Ghép kỳ báo cáo và evidence JSON thành prompt tiếng Việt, yêu cầu sáu section, heading H4, bullet/bảng Notion Markdown và không thêm dữ kiện ngoài evidence.

### `src/schedule-config.ts` và `src/schedule.ts`

- Cấu hình lịch: Chủ nhật 06:00, timezone `Asia/Ho_Chi_Minh`.
- Kỳ dữ liệu mặc định: thứ Hai đến thứ Bảy gần nhất.
- `calculateScheduledReportPeriod()` lấy ngày hiện tại theo timezone, tính `startDate` và `endDate`, có hỗ trợ `weekOffset`.

### `src/telegram.ts`

- `sendTelegramMessage()` gọi Telegram Bot API `sendMessage`.
- `sendWeeklyReportNotification()` gửi trạng thái thành công, kỳ báo cáo và URL Notion page.
- API error được ném lên để `index.ts` ghi log; không làm report đã tạo bị coi là thất bại.

## Luồng dữ liệu

```text
GitHub Actions (cron/manual)
  -> POST body + HMAC
Notion Worker (index.ts)
  -> verify signature
  -> calculate report period
Notion Activities (notion.ts)
  -> query + pagination + normalize
Evidence + Writing Guide (report-guide.ts)
  -> Gemini (gemini.ts)
Report Markdown
  -> Notion report page (notion.ts)
  -> Telegram notification (telegram.ts)
```

## Secrets

- Worker: `NOTION_API_TOKEN`, `GEMINI_API_KEY`, `WORKER_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
- GitHub Actions: `WORKER_WEBHOOK_URL`, `WORKER_WEBHOOK_SECRET`.
- Không commit secret thật, `.env-telegram`, `.env` hoặc output build.