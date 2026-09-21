# Architecture

1. GitHub Actions chạy theo cron hoặc `workflow_dispatch`.
2. Workflow ký request bằng HMAC-SHA256.
3. Notion Worker xác thực chữ ký và tính kỳ báo cáo.
4. Worker đọc Activities trực tiếp bằng Notion API.
5. Worker gửi Activities JSON và Writing Guide cho Gemini.
6. Gemini chịu trách nhiệm phân tích, viết và định dạng.
7. Worker chèn nguyên văn output vào page con của `List of reports`.

## Secret boundaries

- Worker giữ `NOTION_API_TOKEN`, `GEMINI_API_KEY` và `WORKER_WEBHOOK_SECRET`.
- GitHub Actions chỉ giữ `WORKER_WEBHOOK_URL` và `WORKER_WEBHOOK_SECRET`.
- Không lưu giá trị secret thật trong source code hoặc commit history.
