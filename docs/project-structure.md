# Project Structure — Weekly Sales Report Worker

> Mô tả vai trò và chức năng của từng file trong dự án **Weekly Sales Report Worker**.

---

## Tổng quan kiến trúc

```
Weekly-sales-report/
├── .env.example                        # Template biến môi trường
├── package.json                        # Metadata & dependencies
├── package-lock.json                   # Snapshot phụ thuộc đã lock
├── README.md                           # Hướng dẫn dự án
├── tsconfig.json                       # Cấu hình TypeScript
├── workers.json                        # Cấu hình Notion Worker
├── .github/
│   └── workflows/
│       └── weekly-report.yml           # GitHub Actions schedule
├── docs/
│   ├── architecture.md                 # Sơ đồ kiến trúc hệ thống
│   ├── github-actions-scheduling.md    # Hướng dẫn schedule GitHub Actions
│   └── project-structure.md            # ← File này
├── prompts/
│   └── weekly-report-guide.md          # Prompt/Writing Guide cho Gemini
└── src/
    ├── config.ts                       # Cấu hình chung (IDs, endpoints, timeouts)
    ├── gemini.ts                       # Kết nối API Gemini
    ├── index.ts                        # Entry point – định nghĩa tools & webhooks
    ├── notion.ts                       # Tương tác Notion API (đọc Activities, tạo page)
    ├── report-guide.ts                 # Xây dựng prompt báo cáo cho Gemini
    ├── schedule-config.ts              # Cấu hình lịch chạy (ngày, giờ, timezone)
    └── schedule.ts                     # Logic tính toán kỳ báo cáo tự động
```

---

## Root files

### `.env.example`
Template file chứa các biến môi trường bắt buộc:
- `NOTION_API_TOKEN` — Token xác thực Notion.
- `GEMINI_API_KEY` — API key cho Gemini.
- `WORKER_WEBHOOK_SECRET` — Secret dùng để ký xác thực webhook từ GitHub Actions.

> ⚠️ Không commit giá trị secret thật vào repository.

---

### `package.json`
Metadata của project:
- **Name:** `weekly-sales-report-worker` (version `0.2.0`).
- **Type:** ESM (`"type": "module"`).
- **Scripts:** `build` (biên dịch TypeScript), `check` (type-check không emit).
- **Dependencies:** `@notionhq/workers` — SDK Notion Worker.
- **DevDependencies:** `typescript`, `tsx` (chạy TS không cần compile), `@types/node`.
- **Engines:** Node.js `>=22.0.0`, npm `>=10.9.2`.

---

### `package-lock.json`
Snapshot lockfile ghi lại chính xác phiên bản mọi dependency (direct & transitive). Đảm bảo cài đặt giống nhau trên mọi máy.

---

### `README.md`
Tài liệu hướng dẫn chính của dự án:
- Mô tả ngắn gọn: Notion Worker đọc Activities, gửi JSON + Writing Guide cho Gemini, tạo báo cáo trong Notion.
- Liệt kê 4 capabilities: `prepareActivitiesJson`, `generateSalesReport`, `scheduledWeeklyReport`, `testGeminiConnection`.
- Mặc định: chạy 06:00 Chủ nhật, kỳ dữ liệu thứ Hai–Thứ Bảy.
- Secrets cần thiết cho cả Worker và GitHub Actions.
- Hướng dẫn kiểm tra & deploy.
---

## `.github/workflows/`

### `.github/workflows/weekly-report.yml`
GitHub Actions workflow tự động trigger báo cáo hàng tuần:
- **Schedule:** Cron `0 23 * * 6` (23:00 UTC thứ Bảy = 06:00 Chủ nhật giờ Việt Nam).
- **workflow_dispatch:** Cho phép chạy thủ công.
- **Bước:** Gửi POST request đến Notion Worker webhook, body được ký HMAC-SHA256 bằng `WORKER_WEBHOOK_SECRET`.
- **Secrets:** `WORKER_WEBHOOK_URL`, `WORKER_WEBHOOK_SECRET` (lưu trong GitHub Secrets, không trong code).

---

## `docs/`

### `docs/architecture.md`
Sơ đồ kiến trúc 7 bước của hệ thống:
1. GitHub Actions trigger theo cron hoặc `workflow_dispatch`.
2. Workflow ký request bằng HMAC-SHA256.
3. Notion Worker xác thực chữ ký, tính kỳ báo cáo.
4. Worker đọc Activities trực tiếp bằng Notion API.
5. Worker gửi Activities JSON + Writing Guide cho Gemini.
6. Gemini phân tích, viết, định dạng báo cáo.
7. Worker chèn nguyên văn output vào page con của `List of reports`.

Ngoài ra còn mô tả **Secret boundaries** — phân quyền secret giữa Worker và GitHub Actions.

---

### `docs/github-actions-scheduling.md`
Hướng dẫn chi tiết về lịch chạy:
- Mặc định: 06:00 Chủ nhật giờ Việt Nam (cron UTC là `0 23 * * 6`).
- Kỳ dữ liệu: thứ Hai đến thứ Bảy gần nhất.
- Nơi chỉnh cấu hình: giờ/ngày trigger trong `.github/workflows/weekly-report.yml`, ngày bắt đầu/kết thúc trong `src/schedule-config.ts`.
- Cách lấy và cấu hình GitHub Actions secrets.

---

### `docs/project-structure.md` *(đang tạo)*
File này — mô tả chi tiết chức năng từng file trong toàn bộ dự án.


---

### `tsconfig.json`
Cấu hình TypeScript compiler:
- **target:** ES2020, **module:** nodenext (Node.js ESM).
- **strict:** true — kiểm gắt gàng.
- **rootDir:** `./src`, **outDir:** `./dist`.
- **resolveJsonModule:** true — cho phép import JSON.

---

### `workers.json`
Cấu hình triển khai Notion Worker:
- `version`: phiên bản schema config.
- `environment`: `"prod"` (môi trường production).
- `workspaceId`: ID workspace Notion.
- `workerId`: ID worker duy nhất.
---

## `prompts/`

### `prompts/weekly-report-guide.md`
Writing Guide (prompt system) dành cho Gemini — tác giả duy nhất của báo cáo:
- **Nguyên tắc:** Không bịa dữ liệu, không tự gắn Opportunity Product, tách Customer/Partner, nêu rõ kết quả & rủi ro, dùng Notion-flavored Markdown.
- **Sections bắt buộc:** 📌 Tổng quan nhanh, 🚦 Opportunity Health, ⭐ Diễn biến nổi bật, ⚠️ Cần chú ý/rủi ro, 🎯 Trọng tâm tuần tới, 📅 Lịch làm việc Lãnh đạo.
- **Opportunity Health mapping:** Positive → Healthy, Negative → At Risk, Neutral/Waiting/Blocked → Watch.

---

## `src/`

### `src/config.ts`
Cấu hình chung (constant) của ứng dụng:
- `activitiesDataSourceId` — ID database Activities trong Notion.
- `reportParentPageId` — ID page cha (`List of reports`) để tạo page con.
- `geminiModel` — Model Gemini sử dụng (`gemini-3.6-flash`).
- `geminiEndpoint` / `geminiAuthEndpoint` — URL API Gemini.
- `geminiMaxAttempts` (2), `geminiAttemptTimeoutMs` (70s), `geminiRetryDelayMs` (5s) — Cấu hình retry.

---

### `src/gemini.ts`
Module kết nối Gemini API:
- **`generateGeminiText(prompt, systemInstruction)`:** Gửi prompt đến Gemini với retry logic (2 lần), timeout 70s, retry delay 5s. Tự động trích xuất text từ response.
- **`testGeminiAuthentication()`:** Kiểm tra kết nối Gemini bằng cách gọi endpoint kiểm tra model.
- Đọc `GEMINI_API_KEY` từ biến môi trường.
- Xử lý lỗi retry cho các status: 429, 500, 502, 503, 504.

---

### `src/index.ts`
**Entry point chính** — đăng ký worker với Notion:
- Khởi tạo `Worker` và export default.
- Định nghĩa **4 công cụ (tools/webhooks)**:

| Tool/Webhook | Mô tả |
|---|---|
| `prepareActivitiesJson` | Đọc Activities theo ngày, trả về JSON evidence (read-only). |
| `generateSalesReport` | Tạo báo cáo thủ công với `startDate` + `endDate`. |
| `scheduledWeeklyReport` | Webhook xác thực HMAC, tự tính kỳ báo cáo và tạo report. |
| `testGeminiConnection` | Kiểm tra kết nối Gemini (read-only). |

- **`collectEvidence()`:** Đọc Activities, đóng gói thành JSON evidence.
- **`generateReport()`:** Gửi evidence cho Gemini, tạo page Notion chứa kết quả. Nếu lỗi → tạo page ghi chú thất bại.
- **`verifyScheduledWebhook()`:** Xác thực chữ ký HMAC-SHA256 từ GitHub Actions.

---

### `src/notion.ts`
Module tương tác Notion API:
- **`validateDateOnly(value)`:** Kiểm tra định dạng ngày `YYYY-MM-DD`.
- **`addDays(dateOnly, days)`:** Cộng thêm N ngày vào date string.
- **`readActivities(notion, startDate, endDate)`:** Query database Activities theo khoảng ngày, hỗ trợ pagination, chuẩn hóa property (title, rich_text, date, select, multi_select...).
- **`createReportPage(notion, title, markdown)`:** Tạo page mới dưới `reportParentPageId` với title và markdown content.

---

### `src/report-guide.ts`
Xây dựng prompt (system message + user message) gửi cho Gemini:
- **`buildReportPrompt(evidenceJson, startDate, endDate)`:** Trả về chuỗi prompt tiếng Việt, bao gồm:
  - Role & nhiệm vụ của Gemini.
  - Cấu trúc báo cáo bắt buộc (6 sections).
  - Quy tắc trình bày (Notion Markdown, emoji, heading H4, bảng).
  - Mapping Opportunity Health.
  - Kèm `evidenceJson` (Activities data).

---

### `src/schedule-config.ts`
Cấu hình lịch chạy (không chứa logic):
- `triggerTimeZone`: `"Asia/Ho_Chi_Minh"`.
- `triggerDay` / `triggerHour` / `triggerMinute`: Chủ nhật, 06:00.
- `reportStartDay`: `MONDAY`, `reportEndDay`: `SATURDAY` — kỳ dữ liệu.
- `weekOffset`: 0 (kỳ gần nhất; `-1` = lùi 1 tuần).
- Export type `Weekday` — union type các ngày trong tuần.

---

### `src/schedule.ts`
Logic tính toán kỳ báo cáo tự động:
- **`calculateScheduledReportPeriod(now)`:** Dựa trên `scheduleConfig`, tính:
  - `endDate`: thứ Bảy gần nhất (hoặc lùi theo `weekOffset`).
  - `startDate`: thứ Hai bắt đầu kỳ đó.
- Sử dụng `Intl.DateTimeFormat` để xử lý timezone chính xác.
- Đọc `scheduleConfig` và dùng `addDays` từ `notion.ts`.

---

## Luồng dữ liệu tổng hợp

```
GitHub Actions (cron)
  │  POST /webhook (HMAC signed)
  ▼
Notion Worker (index.ts)
  │  1. verifyScheduledWebhook()
  │  2. calculateScheduledReportPeriod()
  │  3. readActivities() → evidence JSON
  │  4. buildReportPrompt() → prompt
  │  5. generateGeminiText() → report markdown
  │  6. createReportPage() → Notion page
  ▼
Gemini API (gemini.ts)
  ← Trả về báo cáo Markdown
```

