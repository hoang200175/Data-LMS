import { useEffect, useRef, useState, type ReactNode } from 'react';
import { loadProgress, update } from '../lib/progress';
import AiFeedback from './AiFeedback';

// Tình huống: đọc bối cảnh, ghi câu trả lời, nộp (bị khoá), rồi mới mở đáp án mẫu (children) và tự chấm.
type Props = { id: string; title: string; context: string; question: string; children?: ReactNode };

export default function Situation({ id, title, context, question, children }: Props) {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState<{ text: string; at: string } | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const keyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = loadProgress();
    const raw = p.code[`answer:${id}`];
    if (raw) setSaved(JSON.parse(raw));
    setGrade(p.code[`answer:${id}:grade`] ?? null);
  }, []);

  function submit() {
    const s = { text: draft.trim(), at: new Date().toISOString() };
    update((p) => void (p.code[`answer:${id}`] = JSON.stringify(s)));
    setSaved(s);
  }

  function selfGrade(g: string) {
    update((p) => {
      p.code[`answer:${id}:grade`] = g;
      p.done[id] = g === 'Đúng';
    });
    setGrade(g);
  }

  return (
    <div className="answer-first situation">
      <p className="sit-title">{title}</p>
      <p><strong>Bối cảnh.</strong> {context}</p>
      <p className="q"><strong>Câu hỏi.</strong> {question}</p>
      {!saved ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} placeholder="Viết câu trả lời của bạn trước khi xem đáp án mẫu…" />
          <button className="primary" onClick={submit} disabled={draft.trim().length < 10}>Nộp và mở đáp án mẫu</button>
          <p className="hint">Câu trả lời đã nộp sẽ được khoá lại, không sửa được.</p>
        </>
      ) : (
        <>
          <div className="mine"><strong>Câu trả lời của bạn</strong> ({new Date(saved.at).toLocaleString('vi-VN')}):<br />{saved.text}</div>
          <div className="key" ref={keyRef}>{children}</div>
          <div className="grade">
            Tự chấm:{' '}
            {['Đúng', 'Một phần', 'Sai'].map((g) => (
              <button key={g} className={grade === g ? 'primary' : ''} onClick={() => selfGrade(g)}>{g}</button>
            ))}
          </div>
          <AiFeedback id={id} build={() => ({ kind: 'answer', question: `${context}\n${question}`, answer: saved.text, modelAnswer: keyRef.current?.innerText ?? '' })} />
        </>
      )}
    </div>
  );
}
