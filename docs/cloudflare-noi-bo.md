# Đưa Data LMS lên Cloudflare Pages + Access (website nội bộ)

Mục tiêu: chỉ người trong phòng (email được cho phép) mới mở được website. Miễn phí tới 50 người dùng.

## Bước 1. Tạo tài khoản Cloudflare (anh Hoang làm, khoảng 2 phút)

Vào https://dash.cloudflare.com/sign-up, đăng ký bằng email của anh.

## Bước 2. Tạo project Pages nối với GitHub (khoảng 5 phút)

1. Trong Cloudflare: **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Cho phép Cloudflare truy cập GitHub, chọn repo **hoang200175/Data-LMS**.
3. Cấu hình build:
   - Project name: `data-lms` (link sẽ là `https://data-lms.pages.dev`)
   - Production branch: `main`
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `BASE_PATH` = `/` và `SITE_URL` = `https://data-lms.pages.dev`
4. Bấm **Save and Deploy**. Từ nay mỗi lần merge vào `main`, Cloudflare tự build lại.

## Bước 3. Khoá website bằng Cloudflare Access (khoảng 5 phút)

1. Trong Cloudflare: **Zero Trust** (lần đầu sẽ hỏi chọn gói: chọn **Free**, có thể phải nhập thẻ nhưng không bị trừ tiền).
2. **Access** → **Applications** → **Add an application** → **Self-hosted**.
   - Application domain: `data-lms.pages.dev` (và thêm `*.data-lms.pages.dev` để khoá cả các bản preview).
   - Session duration: 1 tháng (để người học không phải đăng nhập lại liên tục).
3. Thêm **Policy**: Action = **Allow**, Include = **Emails ending in** `@<tên miền công ty>`, hoặc **Emails** = danh sách email từng người.
4. Đăng nhập: người học nhập email, Cloudflare gửi mã một lần (One-time PIN). Không cần tạo mật khẩu.

Kiểm tra: mở `https://data-lms.pages.dev` trong cửa sổ ẩn danh, phải thấy màn hình đăng nhập của Cloudflare.

## Bước 4. Tắt bản công khai (sau khi bước 3 chạy được)

Báo Claude để:
- tắt workflow GitHub Pages và gỡ trang `hoang200175.github.io/Data-LMS`;
- chuyển repo về **Private** (anh làm trong GitHub: Settings → General → Danger Zone → Change visibility). Cloudflare vẫn build được repo private.

Podcast đã nằm trong website (`public/audio/`), nên khi repo chuyển private vẫn nghe được. Video YouTube Unlisted vẫn nhúng bình thường.

## Sau này: tiến độ từng người và AI nhận xét

Khi đã có Access, mỗi lượt truy cập mang theo email người học. Claude sẽ thêm:
- **Cloudflare Pages Functions + D1** (cơ sở dữ liệu miễn phí): lưu tiến độ theo email, trang tổng hợp cho trưởng nhóm;
- **AI nhận xét**: một function gọi API của Claude, API key lưu trong mục *Settings → Variables and Secrets* của project (không bao giờ nằm trong code).
