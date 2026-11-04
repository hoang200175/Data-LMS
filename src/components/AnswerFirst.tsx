import { useEffect, useState } from 'react';
import { loadProgress, update } from '../lib/progress';

// "Ghi log trước, mở đáp án sau": đáp án chỉ hiện khi câu trả lời đã nộp, và câu trả lời đã nộp không sửa được.
type Props = { id: string; question: string; answer: string };

const KEY = (id: string) => `answer:${id}`;

export default function AnswerFirst({ id, question, answer }: Props) {
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState<{ text: string; at: string } | null>(null);
  const [grade, setGrade] = useState<string | null>(null);

  useEffect(() => {
    const p = loadProgress();
    const raw = p.code[KEY(id)];
    if (raw) setSaved(JSON.parse(raw));
    const g = p.code[KEY(id) + ':grade'];
    if (g) setGrade(g);
  }, []);

  function submit() {
    const s = { text: draft.trim(), at: new Date().toISOString() };
    update((p) => void (p.code[KEY(id)] = JSON.stringify(s)));
    setSaved(s);
  }

  function selfGrade(g: string) {
    update((p) => {
      p.code[KEY(id) + ':grade'] = g;
      p.done[id] = g === 'Đúng';
    });
    setGrade(g);
  }

  return (
    <div className="answer-first">
      <p className="q">{question}</p>
      {!saved ? (
        <>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} placeholder="Viết câu trả lời bằng lời của bạn trước khi xem đáp án…" />
          <button className="primary" onClick={submit} disabled={draft.trim().length < 10}>Nộp và mở đáp án</button>
          <p className="hint">Câu trả lời đã nộp sẽ được khoá lại, không sửa được.</p>
        </>
      ) : (
        <>
          <div className="mine"><strong>Câu trả lời của bạn</strong> ({new Date(saved.at).toLocaleString('vi-VN')}):<br />{saved.text}</div>
          <div className="key"><strong>Đáp án:</strong> {answer}</div>
          <div className="grade">
            Tự chấm:{' '}
            {['Đúng', 'Một phần', 'Sai'].map((g) => (
              <button key={g} className={grade === g ? 'primary' : ''} onClick={() => selfGrade(g)}>{g}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
