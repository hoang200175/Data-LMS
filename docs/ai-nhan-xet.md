# Bật AI nhận xét bài làm

Nút "✦ AI nhận xét" hiện dưới mỗi ô Python và mỗi tình huống, sau khi học viên nộp câu trả lời. Nút chỉ hiện trên bản Cloudflare (data-lms.pages.dev) và chỉ khi máy chủ có khoá API. Tuần 0 không có nút, để không lộ đáp án trước Tuần 16.

Code máy chủ: `functions/api/feedback.ts` (Cloudflare Pages Function). Khoá API chỉ nằm ở Cloudflare, không xuống trình duyệt.

## Các bước (Hoang làm, khoảng 10 phút)

1. Vào https://platform.claude.com (Claude Console), đăng ký, nạp tiền (**Settings → Billing**), rồi vào **API Keys → Create Key**, đặt tên `data-lms`.
2. Giới hạn chi tiêu, chọn một trong hai cách:
   - **Settings → Limits** (https://platform.claude.com/settings/limits), mục *Spend limit* → *Change limit*, đặt ví dụ 20 USD/tháng. Nếu tài khoản mới chưa hiện mục này, có thể đặt theo workspace ở **Settings → Workspaces → (workspace) → Limits**.
   - Cách chắc chắn nhất: chỉ nạp trước một khoản nhỏ (ví dụ 10 USD) và **tắt Auto reload** trong Billing. Hết tiền thì API ngừng, không bị trừ thêm.
3. Vào Cloudflare dashboard → **Workers & Pages → data-lms → Settings → Variables and Secrets → Add**:
   - Type: **Secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: khoá vừa tạo
   - Áp dụng cho môi trường **Production**.
4. Vào tab **Deployments**, chọn bản mới nhất → **Retry deployment** (hoặc chờ lần merge tiếp theo). Biến chỉ có hiệu lực sau lần deploy mới.

Không dán khoá vào chat hay vào repo.

Lưu ý hay gặp:
- Tên phải đúng `ANTHROPIC_API_KEY` (không thêm số hay khoảng trắng) và nằm ở môi trường **Production**.
- Thêm hoặc đổi Secret xong phải có một lần deploy mới thì mới có hiệu lực. Kiểm tra nhanh: mở `https://data-lms.pages.dev/api/feedback`, thấy `{"enabled":true}` là được.
- Nên tạo workspace riêng (Console → Settings → Workspaces → Create workspace, ví dụ `data-lms`) và tạo khoá trong workspace đó, để chi phí và hạn mức của web tách khỏi việc khác. Web chỉ gọi một model cố định trong code (`AI_MODEL`, mặc định `claude-opus-5-5`).

## Biến tuỳ chọn

| Biến | Ý nghĩa |
| --- | --- |
| `AI_MODEL` | Model dùng để nhận xét, mặc định `claude-opus-5-5`. |
| `AI_REQUIRE_ACCESS` | Đặt `1` sau khi bật Cloudflare Access: chỉ người đã đăng nhập mới gọi được AI. |

## Chi phí và giới hạn

- Mỗi lần nhận xét dùng mức suy nghĩ thấp và tối đa 2.000 token trả lời; ước tính khoảng 0,01–0,04 USD một lần.
- Mỗi người (hoặc mỗi IP khi chưa có Access) tối đa khoảng 6 lần mỗi phút.
- Khi site còn công khai, ai biết địa chỉ cũng gọi được, nên hạn mức chi tiêu ở bước 2 là bắt buộc. Sau khi bật Access, đặt `AI_REQUIRE_ACCESS=1`.
