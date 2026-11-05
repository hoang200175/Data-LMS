// Gọi API nhận xét của AI (Cloudflare Pages Function). Trên GitHub Pages không có API này, nút sẽ tự ẩn.
const URL_API = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}api/feedback`;

let enabled: Promise<boolean> | null = null;

export function feedbackEnabled(): Promise<boolean> {
  enabled ??= fetch(URL_API)
    .then((r) => (r.ok ? r.json() : { enabled: false }))
    .then((d) => !!d.enabled)
    .catch(() => false);
  return enabled;
}

export type FeedbackRequest =
  | { kind: 'code'; title?: string; code: string; output?: string; tests?: string }
  | { kind: 'answer'; question: string; answer: string; modelAnswer?: string };

export async function askFeedback(req: FeedbackRequest): Promise<string> {
  const r = await fetch(URL_API, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(req) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.feedback) throw new Error(d.error || `Lỗi ${r.status}`);
  return d.feedback;
}
