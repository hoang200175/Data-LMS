// Cloudflare Pages Function: AI nhận xét bài làm.
// Khoá API nằm trong biến bí mật ANTHROPIC_API_KEY của dự án Cloudflare Pages, không bao giờ xuống trình duyệt.
// GET  /api/feedback  -> { enabled } để trang biết có hiện nút hay không.
// POST /api/feedback  -> { feedback } nhận xét bằng tiếng Việt.
import Anthropic from '@anthropic-ai/sdk';

type Env = {
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;          // mặc định claude-opus-5-5
  AI_REQUIRE_ACCESS?: string; // "1": chỉ trả lời khi người dùng đã đăng nhập qua Cloudflare Access
};

type Body = {
  kind: 'code' | 'answer';
  title?: string;
  question?: string;
  code?: string;
  output?: string;
  tests?: string;
  answer?: string;
  modelAnswer?: string;
};

const MAX_FIELD = 6000;
const PER_MINUTE = 6;
const hits = new Map<string, number[]>(); // giới hạn thô theo người dùng/IP trong một isolate

const SYSTEM = `Bạn là trợ giảng của khoá "Data 16 tuần" cho nhân viên nghiệp vụ mới học phân tích dữ liệu (pandas, thống kê, dự báo). Học viên gửi bài làm của một ô Python hoặc câu trả lời một tình huống. Nhận xét bằng tiếng Việt, giọng đồng nghiệp tử tế, ngắn gọn (tối đa khoảng 180 chữ), theo đúng 3 mục:
1. Điểm làm đúng (1–2 ý cụ thể).
2. Điểm còn thiếu hoặc sai, gọi đúng tên bẫy nếu có (grain, fan-out, average of averages, Simpson, confounder, regression to the mean, survivorship, leakage, base rate…).
3. Một gợi ý bước tiếp theo.
Với bài code: không viết lời giải hoàn chỉnh; chỉ chỉ ra dòng hoặc ý cần sửa. Nếu có đáp án mẫu, dùng nó để đối chiếu nhưng không chép nguyên văn. Không bịa số liệu không có trong bài. Chỉ dùng văn bản thường, không dùng tiêu đề Markdown.`;

function clip(s: unknown): string {
  return typeof s === 'string' ? s.slice(0, MAX_FIELD) : '';
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } });
}

function who(request: Request, env: Env): string | null {
  const email = request.headers.get('cf-access-authenticated-user-email');
  if (env.AI_REQUIRE_ACCESS === '1') return email;
  return email ?? request.headers.get('cf-connecting-ip') ?? 'anon';
}

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  return recent.length > PER_MINUTE;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => json({ enabled: !!env.ANTHROPIC_API_KEY });

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'AI nhận xét chưa được bật trên máy chủ.' }, 503);
  const user = who(request, env);
  if (!user) return json({ error: 'Cần đăng nhập để dùng AI nhận xét.' }, 401);
  if (limited(user)) return json({ error: 'Bạn gửi hơi nhanh, đợi một phút rồi thử lại.' }, 429);

  let b: Body;
  try {
    b = await request.json();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  const parts =
    b.kind === 'code'
      ? [
          `Bài tập: ${clip(b.title)}`,
          `Code của học viên:\n${clip(b.code)}`,
          `Kết quả chạy:\n${clip(b.output) || '(không có)'}`,
          `Kết quả kiểm tra assert:\n${clip(b.tests) || '(chưa bấm Kiểm tra)'}`,
        ]
      : [
          `Câu hỏi: ${clip(b.question)}`,
          `Câu trả lời của học viên:\n${clip(b.answer)}`,
          `Đáp án mẫu (chỉ để bạn đối chiếu):\n${clip(b.modelAnswer) || '(không có)'}`,
        ];
  if ((b.kind === 'code' && !clip(b.code).trim()) || (b.kind === 'answer' && clip(b.answer).trim().length < 5)) {
    return json({ error: 'Chưa có bài làm để nhận xét.' }, 400);
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const msg = await client.beta.messages.create({
      model: env.AI_MODEL || 'claude-opus-5-5',
      max_tokens: 2000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: parts.join('\n\n') }],
    });
    if (msg.stop_reason === 'refusal') return json({ error: 'AI không nhận xét được bài này. Hãy thử diễn đạt lại.' }, 422);
    const text = msg.content.flatMap((c) => (c.type === 'text' ? [c.text] : [])).join('\n').trim();
    return json({ feedback: text || 'AI không trả về nhận xét.' });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: 'AI đang quá tải, thử lại sau ít phút.' }, 429);
    if (e instanceof Anthropic.AuthenticationError) return json({ error: 'Khoá API trên máy chủ không hợp lệ.' }, 500);
    if (e instanceof Anthropic.APIError) {
      // Thông điệp lỗi của Anthropic không chứa khoá; trả ra để dễ chẩn đoán.
      const detail = (e.error as { error?: { type?: string; message?: string } } | undefined)?.error;
      return json({ error: `Lỗi từ AI (${e.status}).`, detail: detail ? `${detail.type}: ${detail.message}` : e.message }, 502);
    }
    return json({ error: 'Không kết nối được tới AI.' }, 502);
  }
};
