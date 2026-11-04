import { useEffect, useState } from 'react';
import { loadProgress, update } from '../lib/progress';

// Câu hỏi nhanh cuối bài: chấm tự động, có giải thích cho từng phương án.
type Q = { q: string; options: string[]; answer: number; explain: string };
type Props = { id: string; title?: string; questions: Q[] };

// Xáo thứ tự phương án theo một hạt giống cố định (id + số câu), để đáp án đúng không luôn nằm ở cùng vị trí
// nhưng thứ tự vẫn giữ nguyên giữa các lần mở trang. Người soạn cứ viết đáp án đúng ở đâu cũng được.
function seededOrder(n: number, seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const idx = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

export default function Quiz({ id, title = 'Câu hỏi nhanh', questions: raw }: Props) {
  const questions = raw.map((q, i) => {
    const order = seededOrder(q.options.length, `${id}:${i}`);
    return { ...q, options: order.map((k) => q.options[k]), answer: order.indexOf(q.answer) };
  });
  const [picked, setPicked] = useState<(number | null)[]>(questions.map(() => null));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const raw = loadProgress().code[`quiz:${id}`];
    if (raw) {
      setPicked(JSON.parse(raw));
      setSubmitted(true);
    }
  }, []);

  const score = picked.filter((p, i) => p === questions[i].answer).length;

  function submit() {
    setSubmitted(true);
    update((p) => {
      p.code[`quiz:${id}`] = JSON.stringify(picked);
      p.done[id] = score === questions.length;
    });
  }

  function retry() {
    setPicked(questions.map(() => null));
    setSubmitted(false);
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <strong>{title}</strong>
        {submitted && (
          <span className={score === questions.length ? 'badge good' : 'badge'}>
            {score}/{questions.length} đúng
          </span>
        )}
      </div>
      {questions.map((q, i) => (
        <fieldset key={i} className="quiz-q">
          <legend>{i + 1}. {q.q}</legend>
          {q.options.map((opt, j) => {
            const state = submitted ? (j === q.answer ? 'right' : picked[i] === j ? 'wrong' : '') : '';
            return (
              <label key={j} className={`quiz-opt ${state}`}>
                <input
                  type="radio"
                  name={`${id}-${i}`}
                  checked={picked[i] === j}
                  disabled={submitted}
                  onChange={() => setPicked(picked.map((p, k) => (k === i ? j : p)))}
                />
                {opt}
              </label>
            );
          })}
          {submitted && <p className="quiz-explain">{picked[i] === q.answer ? '✓ ' : '✗ '}{q.explain}</p>}
        </fieldset>
      ))}
      {!submitted ? (
        <button className="primary" onClick={submit} disabled={picked.some((p) => p === null)}>Nộp bài</button>
      ) : (
        score < questions.length && <button onClick={retry}>Làm lại</button>
      )}
    </div>
  );
}
