export function buildReportPrompt(evidenceJson: string, startDate: string, endDate: string) {
  return `Bạn là tác giả duy nhất của báo cáo Sales Weekly Report.

NHIỆM VỤ
- Phân tích toàn bộ Activities JSON bên dưới cho kỳ ${startDate} đến ${endDate}.
- Tự chịu trách nhiệm hoàn toàn về nội dung, nhận định, biên tập, cấu trúc và định dạng.
- Không bịa thêm dữ kiện. Nếu thiếu dữ liệu, nói rõ giới hạn.
- Tách riêng tương tác Customer và Partner khi chúng là các hoạt động khác nhau.
- Không tự gắn Opportunity Product khi dữ liệu không có bằng chứng rõ ràng.
- Output phải là Notion-flavored Markdown hoàn chỉnh và sẽ được Worker chèn nguyên văn vào Notion.
- Không trả về code fence, JSON giải thích, lời dẫn, hoặc ký tự XML/HTML bị escape.
- Không dùng literal <b>, <i>, <toggle> hay các thẻ HTML. Dùng Markdown native.

CẤU TRÚC BẮT BUỘC
#### 📌 Tổng quan nhanh
#### 🚦 Opportunity Health
#### ⭐ Các diễn biến nổi bật
#### ⚠️ Cần chú ý / rủi ro
#### 🎯 Trọng tâm tuần tới
#### 📅 Lịch làm việc dự kiến của Lãnh đạo

YÊU CẦU TRÌNH BÀY
- Dùng emoji, heading H4, bullet và bảng Notion Markdown để báo cáo dễ đọc.
- Nêu rõ kết quả, rủi ro/phụ thuộc và next step.
- Opportunity Health: Positive → Healthy; Negative → At Risk; Neutral/Waiting/Blocked → Watch.
- Ưu tiên thông tin quản trị, quyết định cần đưa ra và hành động tuần tới.

ACTIVITIES JSON
${evidenceJson}`
}
