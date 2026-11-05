import { useEffect, useState } from 'react';
import { askFeedback, feedbackEnabled, type FeedbackRequest } from '../lib/feedback';
import { loadProgress, update } from '../lib/progress';

// Nút "AI nhận xét". build() lấy bài làm hiện tại lúc bấm. Nhận xét gần nhất được lưu cùng tiến độ.
type Props = { id: string; build: () => FeedbackRequest | null };

export default function AiFeedback({ id, build }: Props) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const key = `ai:${id}`;

  useEffect(() => {
    feedbackEnabled().then(setOn);
    setText(loadProgress().code[key] ?? null);
  }, []);

  if (!on) return null;

  async function go() {
    const req = build();
    if (!req) return;
    setBusy(true);
    setErr(null);
    try {
      const f = await askFeedback(req);
      update((p) => void (p.code[key] = f));
      setText(f);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-feedback">
      <button onClick={go} disabled={busy}>{busy ? 'AI đang đọc bài…' : text ? '✦ AI nhận xét lại' : '✦ AI nhận xét'}</button>
      {err && <p className="verdict bad">{err}</p>}
      {text && (
        <div className="ai-text">
          <strong>Nhận xét của AI</strong> <span className="hint">(tham khảo, có thể sai; đáp án và kiểm tra vẫn là chuẩn)</span>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}
