import { useEffect, useState } from 'react';
import { loadProgress, update } from '../lib/progress';

// Checklist tự chấm, lưu trên máy người học. Đạt khi đánh dấu đủ mọi mục.
type Props = { id: string; title: string; items: string[] };

export default function Checklist({ id, title, items }: Props) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false));

  useEffect(() => {
    const raw = loadProgress().code[`checklist:${id}`];
    if (raw) setChecked(JSON.parse(raw));
  }, []);

  function toggle(i: number) {
    const next = checked.map((c, j) => (j === i ? !c : c));
    setChecked(next);
    update((p) => {
      p.code[`checklist:${id}`] = JSON.stringify(next);
      p.done[id] = next.every(Boolean);
    });
  }

  const n = checked.filter(Boolean).length;
  return (
    <div className="checklist">
      <strong>{title}</strong> <span className={`badge ${n === items.length ? 'good' : ''}`}>{n}/{items.length}</span>
      {items.map((it, i) => (
        <label key={i}>
          <input type="checkbox" checked={checked[i]} onChange={() => toggle(i)} />
          <span>{it}</span>
        </label>
      ))}
      <p className="muted">{n === items.length ? 'Đã đủ mọi mục.' : 'Đạt khi đánh dấu đủ 100% các mục, và mỗi mục đều có bằng chứng trong bài của bạn.'}</p>
    </div>
  );
}
