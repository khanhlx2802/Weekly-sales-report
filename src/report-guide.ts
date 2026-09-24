export function buildReportPrompt(evidenceJson: string, startDate: string, endDate: string) {
  return `Bạn là tác giả toàn bộ Sales Weekly Report.

NHIỆM VỤ
- Phân tích toàn bộ Activities JSON cho kỳ ${startDate} đến ${endDate}.
- Dùng leadershipCalendar trong JSON để tóm tắt lịch Lãnh đạo tuần kế tiếp thành các gạch đầu dòng ngắn gọn, theo ngày và giờ.
- Tự chịu trách nhiệm về nội dung, nhận định, biên tập, cấu trúc và định dạng báo cáo.
- Không bịa thêm dữ kiện. Nếu thiếu dữ liệu, nói rõ giới hạn.
- Tách riêng tương tác Customer và Partner khi chúng là các hoạt động khác nhau.
- Không tự gắn Opportunity Product khi dữ liệu không có bằng chứng rõ ràng.
- Output phải là Notion-flavored Markdown hoàn chỉnh và sẽ được Worker chèn nguyên văn vào Notion.
- Không trả về code fence, JSON giải thích, lời dẫn, hoặc ký tự XML/HTML bị escape.
- Không dùng literal <b>, <i>, <toggle> hay các thẻ HTML. Dùng Markdown native.
- Tuyệt đối không thêm phần giải thích/quy ước phân loại Opportunity Health, không viết các dòng kiểu “Trạng thái được phân loại dựa trên Activity Outcome”, “Positive → Healthy”, “Neutral/Waiting → Watch”, hoặc “Negative → At Risk”. Chỉ trình bày kết quả phân loại thực tế.
- Không tạo bảng/calendar view cho lịch Lãnh đạo. Chỉ tóm tắt bằng bullet; Worker sẽ gắn link lịch trực tiếp sau phần này.

CẤU TRÚC BẮT BUỘC
#### 📌 Tổng quan nhanh
#### 🚦 Opportunity Health
#### ⭐ Các diễn biến nổi bật
#### ⚠️ Cần chú ý / rủi ro
#### 🎯 Trọng tâm tuần tới
#### 📅 Lịch Lãnh đạo tuần tới

YÊU CẦU TRÌNH BÀY
- Dùng emoji, heading H4, bullet và bảng Notion Markdown khi phù hợp.
- Nêu rõ kết quả, rủi ro/phụ thuộc và next step.
- Phân loại thực tế: Positive → Healthy; Negative → At Risk; Neutral/Waiting/Blocked/không có outcome → Watch, nhưng không in quy tắc này trong báo cáo.
- Lịch Lãnh đạo: mỗi sự kiện là một bullet, gồm ngày/giờ, tên sự kiện, lãnh đạo/chủ trì, địa điểm và trạng thái nếu có. Nếu không có sự kiện, ghi rõ “Không có sự kiện trong dữ liệu lịch tuần tới”.
- Ưu tiên thông tin quản trị, quyết định cần đưa ra và hành động tuần tới.

REPORT JSON
${evidenceJson}`
}
