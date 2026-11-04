# Data-LMS

Data Learning System for Newbie: website tự học theo lộ trình Data 16 tuần (6 phase, checkpoint A/B/C tự chấm).

## Bản khung hiện có

- Trang lộ trình 17 tuần (Tuần 0 đến 16), nhóm theo phase.
- Ô code Python chạy ngay trên trình duyệt bằng [Pyodide](https://pyodide.org) (pandas, numpy, matplotlib, scikit-learn…), có nút **Kiểm tra** chạy `assert` và kiểm tra ẩn.
- Cơ chế "trả lời trước, mở đáp án sau": câu trả lời nộp rồi bị khoá, sau đó mới hiện đáp án và tự chấm.
- Tiến độ và code lưu trên máy người học (localStorage).
- Bài mẫu: Tuần 0 (2 câu tình huống) và Tuần 2 (grain, Superstore).

## Chạy trên máy

```bash
npm install
npm run dev      # mở http://localhost:4321
npm run build    # xuất site tĩnh ra dist/
```

## Thêm bài học

Tạo file `src/content/weeks/week-XX.mdx` với frontmatter `week`, `title`, `minutes`. Dùng các component:

```mdx
<PythonCell client:visible id="w05-fanout" title="..." code={`...`}
  tests={[{ code: "assert ...", message: "..." }, { code: "assert ...", message: "...", hidden: true }]} />

<AnswerFirst client:visible id="w05-c1" question="..." answer="..." />
```

`id` phải duy nhất trên toàn site vì dùng để lưu tiến độ.

## Dữ liệu

`public/datasets/superstore_sample.csv` là dữ liệu **giả lập** theo cấu trúc Superstore (sinh bằng `scripts/make_sample_superstore.py`), có cài sẵn 1 dòng trùng và 1 Product ID mang 2 tên cho bài data quality. Có thể thay bằng file Superstore gốc khi đã xác nhận điều khoản sử dụng.

## Deploy

Workflow `.github/workflows/deploy.yml` build và đưa site lên GitHub Pages mỗi khi push lên `main`. Cần bật một lần: Settings → Pages → Source: **GitHub Actions**.
