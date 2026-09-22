# Kiến trúc hệ thống báo cáo doanh số

Tài liệu này mô tả hệ thống bằng ngôn ngữ đơn giản: mỗi bên tham gia làm gì và một báo cáo được tạo như thế nào.
## Các bên tham gia

### 1. GitHub Actions - người khởi động
GitHub Actions là chiếc đồng hồ của hệ thống.

- Tự khởi động vào 06:00 sáng Chủ nhật theo giờ Việt Nam.
- Có thể được bấm chạy thủ công khi cần.
- Gửi một yêu cầu đến Notion Worker để bắt đầu tạo báo cáo.
- Gửi kèm một mã kiểm tra để Worker biết yêu cầu thật sự đến từ GitHub Actions.
### 2. Notion Worker - người điều phối

Notion Worker là phần trung tâm của hệ thống. Worker nhận yêu cầu rồi lần lượt gọi các dịch vụ khác.

- Kiểm tra yêu cầu có hợp lệ không.
- Tính khoảng thời gian cần làm báo cáo.
- Lấy dữ liệu hoạt động bán hàng từ Notion.
- Gửi dữ liệu cho Gemini.
- Nhận nội dung báo cáo từ Gemini và lưu vào Notion.
- Gửi tin nhắn báo hoàn tất qua Telegram.
### 3. Notion - nơi lưu dữ liệu

Notion có hai nơi dữ liệu được sử dụng:

- `Activities`: nơi nhân viên lưu các hoạt động bán hàng, ví dụ cuộc gọi, buổi demo hoặc lần trao đổi với khách hàng.
- `List of reports`: nơi chứa các báo cáo đã tạo. Mỗi lần chạy thành công, hệ thống tạo một trang báo cáo mới bên dưới trang này.
### 4. Gemini - người phân tích và viết báo cáo

Gemini nhận danh sách hoạt động bán hàng cùng hướng dẫn viết báo cáo. Gemini làm cả hai việc:

- Phân tích dữ liệu.
- Viết thành báo cáo hoàn chỉnh.
Notion AI không tham gia vào luồng hiện tại. Worker lấy nguyên văn nội dung Gemini trả về và lưu vào Notion.

### 5. Telegram - nơi nhận thông báo

Sau khi tạo báo cáo xong, hệ thống gửi tin nhắn Telegram gồm:
- Khoảng thời gian của báo cáo.
- Đường dẫn mở báo cáo trong Notion.

Telegram chỉ dùng để thông báo. Nếu Telegram gặp lỗi, báo cáo trong Notion vẫn được xem là tạo thành công.
## Các bước tạo báo cáo

### Bước 1: Đến giờ chạy

Vào 06:00 sáng Chủ nhật theo giờ Việt Nam, GitHub Actions tự khởi động. GitHub tính giờ theo UTC nên trong mã nguồn giờ này được viết là 23:00 UTC thứ Bảy.
Người dùng cũng có thể bấm chạy thủ công từ GitHub Actions.

### Bước 2: Kiểm tra người gửi

GitHub Actions gửi một mã kiểm tra kèm yêu cầu. Notion Worker đối chiếu mã này với mã bí mật đã được lưu sẵn.
- Mã đúng: tiếp tục xử lý.
- Mã thiếu hoặc sai: dừng ngay, không đọc dữ liệu Notion.

Việc này giúp người lạ không thể tự ý gọi hệ thống tạo báo cáo.
### Bước 3: Xác định kỳ báo cáo

Worker xác định kỳ gần nhất cần báo cáo là từ thứ Hai đến hết thứ Bảy.

Ví dụ, khi chạy vào Chủ nhật ngày 20/09, hệ thống lấy dữ liệu từ thứ Hai ngày 14/09 đến thứ Bảy ngày 19/09.
### Bước 4: Lấy hoạt động từ Notion

Worker vào bảng `Activities` và lấy những dòng có ngày nằm trong kỳ báo cáo.

- Lấy từ ngày bắt đầu đến ngày kết thúc, bao gồm cả hai ngày.
- Sắp xếp từ ngày cũ đến ngày mới.
- Mỗi lần lấy tối đa 100 dòng.
- Nếu có hơn 100 dòng, Worker tự lấy tiếp cho đến khi đủ.

Mỗi dòng trong bảng được xem là một hoạt động bán hàng. Ví dụ một cuộc gọi hoặc một buổi demo là một hoạt động.
### Bước 5: Chuẩn bị dữ liệu cho Gemini

Worker gom toàn bộ hoạt động thành một gói dữ liệu, kèm hướng dẫn về cách viết báo cáo.

Hướng dẫn yêu cầu Gemini không tự bịa thông tin, nêu rõ rủi ro và viết báo cáo theo đúng các mục đã thống nhất.
### Bước 6: Gemini phân tích và viết

Gemini đọc gói dữ liệu rồi tạo báo cáo bằng Markdown, một dạng văn bản có thể hiển thị đẹp trong Notion.

Nếu kết nối tạm thời gặp vấn đề, Worker thử lại tối đa hai lần. Mỗi lần chờ tối đa 70 giây.
### Bước 7: Lưu báo cáo vào Notion

Worker tạo một trang mới bên dưới `List of reports` và chèn nguyên văn nội dung Gemini trả về.

Sau bước này, báo cáo đã có thể được mở và đọc trong Notion.
### Bước 8: Gửi thông báo Telegram

Worker gửi tin nhắn gồm kỳ báo cáo và đường dẫn đến trang Notion vừa tạo.

Nếu chưa cấu hình Telegram hoặc Telegram tạm thời lỗi, Worker chỉ ghi lại lỗi. Nội dung báo cáo trong Notion không bị ảnh hưởng.
## Khi có lỗi

- Nếu mã kiểm tra từ GitHub Actions sai: hệ thống dừng trước khi đọc Notion.
- Nếu không đọc được `Activities`: lần chạy báo cáo thất bại.
- Nếu Gemini không trả được nội dung: Worker cố tạo một trang báo lỗi trong Notion rồi báo thất bại.
- Nếu không tạo được trang báo cáo: lần chạy báo cáo thất bại.
- Nếu Telegram lỗi: báo cáo vẫn thành công, chỉ không gửi được thông báo.

## Thông tin cần bảo mật

Các mã dưới đây là thông tin bí mật, không đưa vào GitHub hoặc tài liệu công khai:
- `NOTION_API_TOKEN`: cho phép Worker truy cập Notion.
- `GEMINI_API_KEY`: cho phép Worker gọi Gemini.
- `WORKER_WEBHOOK_SECRET`: mã dùng để kiểm tra yêu cầu từ GitHub Actions.
- `TELEGRAM_BOT_TOKEN`: mã điều khiển bot Telegram.
- `TELEGRAM_CHAT_ID`: địa chỉ nơi nhận tin nhắn Telegram.
Các ID như `activitiesDataSourceId` và `reportParentPageId` chỉ là địa chỉ của bảng/trang trong Notion, không phải mật khẩu. Chúng hiện được lưu trong `src/config.ts`.

File `.env-telegram` chỉ dùng trên máy cá nhân và đã được Git bỏ qua, không đưa lên repository.
