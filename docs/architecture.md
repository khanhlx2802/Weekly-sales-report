# Hệ thống báo cáo doanh số hàng tuần

## 1. Mục đích

Mỗi tuần, hệ thống tự lấy các hoạt động bán hàng đã được ghi trong Notion, nhờ Gemini phân tích, tạo một báo cáo mới trong Notion và gửi thông báo qua Telegram.

Người dùng không cần tự tổng hợp dữ liệu hay tự viết báo cáo.

## 2. Tóm tắt trong một câu

```text
Đến lịch -> lấy dữ liệu -> phân tích -> ghép lịch lãnh đạo -> lưu báo cáo -> báo kết quả
```

## 3. Ai làm việc gì?

### GitHub Actions: chiếc đồng hồ

Đây là bộ hẹn giờ của hệ thống.

- Tự chạy lúc 06:00 sáng Chủ nhật theo giờ Việt Nam.
- Có thể bấm chạy thủ công khi cần.
- Gọi bộ phận xử lý báo cáo để bắt đầu công việc.

GitHub Actions không đọc dữ liệu và không viết báo cáo. Nó chỉ có nhiệm vụ “đánh thức” hệ thống.

### Notion Worker: người điều phối

Đây là phần trung tâm. Có thể hiểu đơn giản là một nhân viên tự động làm lần lượt các việc sau:

1. Kiểm tra yêu cầu có đến từ hệ thống được phép hay không.
2. Xác định tuần nào cần làm báo cáo.
3. Đọc dữ liệu bán hàng và lịch lãnh đạo từ Notion.
4. Gửi dữ liệu bán hàng cho Gemini phân tích.
5. Ghép phần phân tích với lịch lãnh đạo.
6. Tạo một trang báo cáo mới trong Notion.
7. Báo kết quả qua Telegram.

### Notion: nơi lưu dữ liệu

Notion có ba khu vực liên quan:

- **Activities**: danh sách các hoạt động bán hàng như gọi điện, gặp khách hàng, demo hoặc trao đổi với đối tác.
- **Leadership Calendar**: lịch làm việc của lãnh đạo.
- **Khu vực báo cáo**: nơi hệ thống tạo các báo cáo mới.

### Gemini: người đọc và viết phần phân tích

Gemini nhận dữ liệu bán hàng và viết phần nhận xét cho báo cáo.

Gemini được yêu cầu:

- Chỉ dùng thông tin có trong dữ liệu.
- Không tự bịa thêm sự kiện.
- Nói rõ khi dữ liệu chưa đủ.
- Nêu kết quả, vấn đề, rủi ro và việc cần làm tiếp theo.

Gemini chỉ viết phần phân tích. Lịch lãnh đạo do hệ thống đọc trực tiếp từ Notion rồi chèn vào sau, để bảo đảm lịch là dữ liệu thật.

### Telegram: nơi nhận thông báo

Telegram chỉ dùng để báo kết quả:

- Thành công: gửi kỳ báo cáo và đường dẫn mở báo cáo trong Notion.
- Thất bại: gửi nguyên nhân và số lượng dữ liệu đã đọc được.

Nếu Telegram bị lỗi nhưng báo cáo đã được tạo trong Notion, báo cáo vẫn được xem là thành công.

## 4. Một báo cáo được tạo như thế nào?

### Bước 1: Hệ thống đến giờ chạy

Vào 06:00 sáng Chủ nhật, GitHub Actions gọi hệ thống. Người dùng cũng có thể bấm chạy thủ công.

### Bước 2: Kiểm tra người gọi

Hệ thống kiểm tra một “chữ ký bí mật” đi kèm yêu cầu.

- Chữ ký đúng: tiếp tục.
- Chữ ký thiếu hoặc sai: dừng ngay.

Việc này ngăn người ngoài tự ý gọi hệ thống tạo báo cáo.

### Bước 3: Xác định tuần cần báo cáo

Mặc định, hệ thống lấy dữ liệu từ thứ Hai đến hết thứ Bảy gần nhất.

Ví dụ, nếu chạy vào Chủ nhật 20/09:

- Kỳ báo cáo: 14/09 đến 19/09.
- Lịch lãnh đạo được lấy cho tuần tiếp theo: 21/09 đến 26/09.

Ngày được tính theo giờ Việt Nam, nên không bị ảnh hưởng bởi giờ của máy chủ ở nơi khác.

### Bước 4: Đọc dữ liệu từ Notion

Hệ thống đọc song song hai loại dữ liệu:

1. Các hoạt động bán hàng trong kỳ báo cáo.
2. Các sự kiện trong lịch lãnh đạo của tuần kế tiếp.

Hệ thống lấy đủ dữ liệu kể cả khi có hơn 100 dòng. Các hoạt động được sắp xếp từ ngày cũ đến ngày mới.

### Bước 5: Nhờ Gemini viết phần phân tích

Hệ thống gửi toàn bộ hoạt động bán hàng cùng hướng dẫn viết báo cáo cho Gemini.

Phần phân tích cần có năm nội dung chính:

- Tổng quan nhanh.
- Tình trạng các cơ hội bán hàng.
- Những diễn biến nổi bật.
- Vấn đề hoặc rủi ro cần chú ý.
- Trọng tâm của tuần tới.

### Bước 6: Chèn lịch lãnh đạo

Sau khi nhận phần phân tích, hệ thống tự tạo một bảng lịch từ dữ liệu thật trong Notion.

Mỗi sự kiện có thể hiển thị:

- Thời gian hoặc ghi “Cả ngày”.
- Tên sự kiện.
- Người lãnh đạo tham gia.
- Trạng thái.
- Địa điểm.
- Đường dẫn mở chi tiết trong Notion.

### Bước 7: Tạo báo cáo trong Notion

Hệ thống tạo một trang mới, gồm:

1. Phần phân tích do Gemini viết.
2. Phần lịch lãnh đạo do hệ thống lấy từ Notion.

Nội dung phân tích được giữ nguyên, không bị hệ thống tự sửa hoặc viết lại.

### Bước 8: Gửi thông báo

Sau khi trang Notion được tạo thành công, hệ thống gửi thông báo qua Telegram.

## 5. Khi có lỗi thì sao?

| Tình huống | Kết quả |
| --- | --- |
| Yêu cầu không có chữ ký đúng | Dừng trước khi đọc dữ liệu |
| Ngày cần báo cáo không hợp lệ | Dừng xử lý |
| Không đọc được dữ liệu bán hàng hoặc lịch lãnh đạo | Không tạo báo cáo |
| Gemini không phản hồi, quá thời gian hoặc trả nội dung rỗng | Không tạo báo cáo |
| Không tạo được trang trong Notion | Báo cáo thất bại |
| Telegram không gửi được sau khi báo cáo đã tạo | Báo cáo vẫn thành công, chỉ mất thông báo |
| Không có thông tin kết nối Telegram | Bỏ qua Telegram, không ảnh hưởng việc tạo báo cáo |

Khi báo cáo thất bại, hệ thống cố gửi một tin nhắn lỗi qua Telegram. Hệ thống không tạo một trang lỗi riêng trong Notion.

## 6. Thông tin cần bảo vệ

Các thông tin dưới đây giống như chìa khóa truy cập và không được đưa lên GitHub hoặc tài liệu công khai:

- `NOTION_API_TOKEN`: cho phép đọc và ghi Notion.
- `GEMINI_API_KEY`: cho phép gọi Gemini.
- `WORKER_WEBHOOK_SECRET`: dùng để xác nhận yêu cầu hợp lệ.
- `TELEGRAM_BOT_TOKEN`: điều khiển bot Telegram.
- `TELEGRAM_CHAT_ID`: địa chỉ nhận tin nhắn.

Các mã nhận diện bảng và trang Notion không phải mật khẩu. File `.env-telegram` chỉ dùng trên máy cá nhân và không được commit.

## 7. Những nơi có thể chạy thủ công

Ngoài lịch tự động, hệ thống có các chức năng hỗ trợ:

- Đọc dữ liệu theo một khoảng ngày để kiểm tra.
- Tạo báo cáo cho một khoảng ngày tùy chọn.
- Kiểm tra kết nối Gemini.

Các chức năng này phục vụ kiểm tra và chạy lại báo cáo khi cần.

## 8. Cấu hình hiện tại

- Giờ chạy: 06:00 Chủ nhật, giờ Việt Nam.
- Kỳ báo cáo: thứ Hai đến thứ Bảy gần nhất.
- Thời gian chờ Gemini: tối đa 70 giây cho một lần gọi.
- Thời gian chờ Telegram: tối đa 10 giây cho một lần gửi.
- Gemini hiện không tự động thử lại khi gặp lỗi.

## 9. Phụ lục dành cho người vận hành

Các file chính trong dự án:

| File | Vai trò |
| --- | --- |
| `src/index.ts` | Điều phối toàn bộ quy trình |
| `src/notion.ts` | Đọc dữ liệu và tạo trang Notion |
| `src/gemini.ts` | Gửi dữ liệu và nhận phần phân tích |
| `src/leadership-calendar.ts` | Tạo bảng lịch lãnh đạo |
| `src/schedule.ts` | Tính kỳ báo cáo |
| `src/telegram.ts` | Gửi thông báo |
| `.github/workflows/weekly-report.yml` | Đặt lịch và kích hoạt hệ thống |

Có thể kiểm tra dự án bằng:

```bash
npm run check
npm run build
```