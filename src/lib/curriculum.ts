// Khung 17 tuần (Tuần 0 + 16 tuần) theo đề xuất trong bản thiết kế.
// Mỗi tuần có trang nội dung khi file src/content/weeks/week-XX.mdx tồn tại.
export type Week = {
  week: number;
  phase: number; // 0 = khởi động
  title: string;
  theory: string;
  python: string;
  checkpoint?: boolean;
};

export const PHASES: Record<number, { name: string; kind: string }> = {
  0: { name: 'Khởi động', kind: 'Đo mức xuất phát' },
  1: { name: 'Nền tảng dữ liệu', kind: '—' },
  2: { name: 'Mô tả', kind: 'Descriptive' },
  3: { name: 'Xác suất', kind: 'Nền tảng cho các phase sau' },
  4: { name: 'Suy luận & Chẩn đoán', kind: 'Diagnostic' },
  5: { name: 'Dự báo', kind: 'Predictive' },
  6: { name: 'Đề xuất & tổng hợp', kind: 'Prescriptive' },
};

export const WEEKS: Week[] = [
  { week: 0, phase: 0, title: 'Kiểm tra đầu vào', theory: 'Làm toàn bộ phần C của 5 phase, chỉ ghi log', python: 'Làm quen ô code trên web' },
  { week: 1, phase: 1, title: 'Dữ liệu là gì', theory: 'Cấu trúc dữ liệu, data-generating process, kiểu biến và thang đo', python: 'Python core' },
  { week: 2, phase: 1, title: 'Grain và cách tổ chức dữ liệu', theory: 'Grain, measure/dimension, fact/dimension, PK/FK, star schema, normalization', python: 'pandas: đọc, chọn, lọc, sắp xếp' },
  { week: 3, phase: 1, title: 'Number sense', theory: 'Fermi, % và pp, base effect; cross-sectional và time series', python: 'Đọc JSON', checkpoint: true },
  { week: 4, phase: 2, title: 'Tóm tắt một biến', theory: 'Trung tâm, phân tán, percentile, phân phối, outlier, chọn chart', python: 'groupby, matplotlib' },
  { week: 5, phase: 2, title: 'Bẫy tổng hợp', theory: 'Data quality, fan-out, weighted average, average of averages, Simpson', python: 'merge, missing values, đối soát tổng' },
  { week: 6, phase: 2, title: 'Tư duy metric', theory: 'Metric, Goodhart, tương quan, funnel, cohort, Pareto', python: 'pivot/melt, datetime, rolling', checkpoint: true },
  { week: 7, phase: 3, title: 'Phân phối', theory: 'Long tail, normal, expected value, binomial', python: 'numpy.random' },
  { week: 8, phase: 3, title: 'Xác suất có điều kiện', theory: 'Xác suất có điều kiện, base rate, LLN, CLT', python: 'pd.crosstab', checkpoint: true },
  { week: 9, phase: 4, title: 'Tương quan và nhân quả', theory: 'Sampling, bias, confounder, randomization, regression to the mean', python: 'EDA end-to-end (Titanic)' },
  { week: 10, phase: 4, title: 'Kiểm định và A/B test', theory: 'CI, p-value, ý nghĩa thống kê và thực tế, A/B test, sample size', python: 'scipy' },
  { week: 11, phase: 4, title: 'Phân rã driver', theory: 'Driver tree, PVM, leading/lagging, trend và seasonality', python: 'Driver tree, PVM', checkpoint: true },
  { week: 12, phase: 5, title: 'Nguyên lý ML', theory: 'Train/test, overfitting, baseline, leakage', python: 'scikit-learn cơ bản' },
  { week: 13, phase: 5, title: 'Phân loại và hồi quy', theory: 'Confusion matrix, precision/recall, linear regression, MAE', python: 'scikit-learn metrics' },
  { week: 14, phase: 5, title: 'Chuỗi thời gian', theory: 'Naive, seasonal naive, moving average, dự báo kèm khoảng', python: 'statsmodels', checkpoint: true },
  { week: 15, phase: 6, title: 'Từ phân tích tới đề xuất', theory: 'Câu hỏi → giả thuyết → so-what, what-if, storytelling', python: 'Code kịch bản' },
  { week: 16, phase: 6, title: 'Capstone', theory: 'Capstone, làm lại phần C và so với Tuần 0', python: '—', checkpoint: true },
];

export const pad = (n: number) => String(n).padStart(2, '0');
