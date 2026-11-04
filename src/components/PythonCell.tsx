import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { runPython, startPython, stopPython, type RunResult, type TestSpec } from '../lib/python';
import { loadProgress, update } from '../lib/progress';

type Props = {
  id: string; // khoá duy nhất, dùng để lưu code và trạng thái đạt
  code: string;
  tests?: TestSpec[];
  title?: string;
};

type Status = 'idle' | 'loading' | 'running';

export default function PythonCell({ id, code, tests = [], title }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<RunResult | null>(null);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const p = loadProgress();
    setDone(!!p.done[id]);
    view.current = new EditorView({
      doc: p.code[id] ?? code,
      extensions: [
        basicSetup,
        python(),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) update((p) => void (p.code[id] = u.state.doc.toString()));
        }),
      ],
      parent: host.current!,
    });
    return () => view.current?.destroy();
  }, []);

  async function go(withTests: boolean) {
    setStatus('loading');
    const warm = startPython().then(() => setStatus('running'));
    try {
      await warm;
      const r = await runPython(view.current!.state.doc.toString(), withTests ? tests : undefined);
      setResult(r);
      setChecked(withTests);
      if (withTests && !r.error && r.tests.every((t) => t.pass)) {
        update((p) => void (p.done[id] = true));
        setDone(true);
      }
    } catch (e: any) {
      setResult({ stdout: '', error: e.message, tests: [], images: [] });
    } finally {
      setStatus('idle');
    }
  }

  function reset() {
    const v = view.current!;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: code } });
  }

  const busy = status !== 'idle';
  const failed = result?.tests.filter((t) => !t.pass) ?? [];

  return (
    <div className="cell">
      <div className="cell-head">
        <span className="cell-title">{title ?? 'Python'}</span>
        {done && <span className="badge good">Đã đạt</span>}
      </div>
      <div ref={host} className="cell-editor" />
      <div className="cell-actions">
        <button onClick={() => go(false)} disabled={busy}>▶ Chạy</button>
        {tests.length > 0 && (
          <button className="primary" onClick={() => go(true)} disabled={busy}>✓ Kiểm tra</button>
        )}
        {busy && <button onClick={stopPython}>■ Dừng</button>}
        <button className="ghost" onClick={reset} disabled={busy}>Khôi phục code gốc</button>
        <span className="cell-status">
          {status === 'loading' && 'Đang khởi động Python (lần đầu mất khoảng 10–20 giây)…'}
          {status === 'running' && 'Đang chạy…'}
        </span>
      </div>
      {result && (
        <div className="cell-output">
          {result.stdout && <pre>{result.stdout}</pre>}
          {result.images.map((b64, i) => (
            <img key={i} src={`data:image/png;base64,${b64}`} alt="Biểu đồ do code tạo ra" />
          ))}
          {result.error && <pre className="err">{result.error}</pre>}
          {checked && !result.error && (
            <ul className="tests">
              {result.tests.map((t, i) => (
                <li key={i} className={t.pass ? 'pass' : 'fail'}>
                  {t.pass ? '✓' : '✗'} {t.hidden ? 'Kiểm tra ẩn: ' : ''}
                  {t.pass && t.hidden ? 'đạt' : t.message}
                  {!t.pass && t.detail && <div className="detail">{t.detail}</div>}
                </li>
              ))}
            </ul>
          )}
          {checked && !result.error && failed.length === 0 && (
            <p className="verdict good">Tất cả kiểm tra đều đạt.</p>
          )}
          {checked && !result.error && failed.length > 0 && (
            <p className="verdict bad">
              {failed.length}/{result.tests.length} kiểm tra chưa đạt. Nếu chênh lệch có lý do, ghi lại lời giải thích vào log: lộ trình tính là đạt khi giải thích được.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
