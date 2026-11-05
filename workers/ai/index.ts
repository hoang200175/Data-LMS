// Worker data-lms-ai: chỉ gọi được qua service binding từ Pages (không có URL công khai).
// Chạy cố định ở Mỹ (placement trong wrangler.toml) để Claude API không chặn theo vùng.
import { callClaude } from '../../shared/claude';

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') return new Response('Not found', { status: 404 });
    const key = request.headers.get('x-anthropic-key');
    if (!key) return Response.json({ error: 'Thiếu khoá.' }, { status: 400 });
    const { model, prompt } = (await request.json()) as { model: string; prompt: string };
    const out = await callClaude(key, model, prompt);
    return Response.json(out.body, { status: out.status });
  },
};
