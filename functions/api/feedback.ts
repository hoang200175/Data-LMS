// Cloudflare Pages Function: AI nhận xét bài làm.
// Khoá API nằm trong biến bí mật ANTHROPIC_API_KEY của dự án Cloudflare Pages, không bao giờ xuống trình duyệt.
// GET  /api/feedback  -> { enabled } để trang biết có hiện nút hay không.
// POST /api/feedback  -> { feedback } nhận xét bằng tiếng Việt.
import { callClaude } from '../../shared/claude';

type Env = {
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;          // mặc định claude-opus-5-5
  AI_REQUIRE_ACCESS?: string; // "1": chỉ trả lời khi người dùng đã đăng nhập qua Cloudflare Access
  AI_WORKER?: Fetcher;        // service binding tới Worker data-lms-ai (chạy ở Mỹ)
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

  const model = env.AI_MODEL || 'claude-opus-5-5';
  const prompt = parts.join('\n\n');
  if (env.AI_WORKER) {
    // Gọi qua Worker chạy ở Mỹ; khoá chỉ đi trong mạng nội bộ Cloudflare.
    const r = await env.AI_WORKER.fetch('https://data-lms-ai/', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-anthropic-key': env.ANTHROPIC_API_KEY },
      body: JSON.stringify({ model, prompt }),
    });
    return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json; charset=utf-8' } });
  }
  const out = await callClaude(env.ANTHROPIC_API_KEY, model, prompt);
  return json(out.body, out.status);
};
