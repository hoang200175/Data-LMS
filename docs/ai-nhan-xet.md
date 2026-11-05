# Bật AI nhận xét bài làm

Nút "✦ AI nhận xét" hiện dưới mỗi ô Python và mỗi tình huống, sau khi học viên nộp câu trả lời. Nút chỉ hiện trên bản Cloudflare (data-lms.pages.dev) và chỉ khi máy chủ có khoá API. Tuần 0 không có nút, để không lộ đáp án trước Tuần 16.

Code máy chủ: `functions/api/feedback.ts` (Cloudflare Pages Function). Khoá API chỉ nằm ở Cloudflare, không xuống trình duyệt.

## Các bước (Hoang làm, khoảng 10 phút)

1. Vào https://console.anthropic.com, đăng ký, nạp tiền (Billing), rồi vào **API Keys → Create Key**, đặt tên `data-lms`.
2. Trong Console, vào **Limits** và đặt hạn mức chi tiêu theo tháng (ví dụ 20 USD), để chắc chắn không phát sinh quá mức khi site còn công khai.
3. Vào Cloudflare dashboard → **Workers & Pages → data-lms → Settings → Variables and Secrets → Add**:
   - Type: **Secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: khoá vừa tạo
   - Áp dụng cho môi trường **Production**.
4. Vào tab **Deployments**, chọn bản mới nhất → **Retry deployment** (hoặc chờ lần merge tiếp theo). Biến chỉ có hiệu lực sau lần deploy mới.

Không dán khoá vào chat hay vào repo.

## Biến tuỳ chọn

| Biến | Ý nghĩa |
| --- | --- |
| `AI_MODEL` | Model dùng để nhận xét, mặc định `claude-opus-5-5`. |
| `AI_REQUIRE_ACCESS` | Đặt `1` sau khi bật Cloudflare Access: chỉ người đã đăng nhập mới gọi được AI. |

## Chi phí và giới hạn

- Mỗi lần nhận xét dùng mức suy nghĩ thấp và tối đa 2.000 token trả lời; ước tính khoảng 0,01–0,04 USD một lần.
- Mỗi người (hoặc mỗi IP khi chưa có Access) tối đa khoảng 6 lần mỗi phút.
- Khi site còn công khai, ai biết địa chỉ cũng gọi được, nên hạn mức chi tiêu ở bước 2 là bắt buộc. Sau khi bật Access, đặt `AI_REQUIRE_ACCESS=1`.
