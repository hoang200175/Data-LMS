// Một worker Python dùng chung cho cả trang (giống một notebook: biến của ô trước dùng được ở ô sau).
export const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
const DATASETS = ['superstore_sample.csv', 'titanic.csv'];

export type TestSpec = { code: string; message: string; hidden?: boolean };
export type RunResult = {
  stdout: string;
  error: string | null;
  tests: { message: string; pass: boolean; hidden?: boolean; detail?: string }[];
  images: string[];
};

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let nextId = 1;
const pending = new Map<number, (v: any) => void>();

function call(msg: any): Promise<any> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, (d) => (d.ok ? resolve(d.result) : reject(new Error(d.error))));
    worker!.postMessage({ ...msg, id });
  });
}

export function startPython(): Promise<void> {
  if (ready) return ready;
  worker = new Worker(new URL('./pyodide-worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (ev) => {
    const cb = pending.get(ev.data.id);
    pending.delete(ev.data.id);
    cb?.(ev.data);
  };
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const files = DATASETS.map((name) => ({ name, url: new URL(`${base}datasets/${name}`, location.href).href }));
  ready = call({ type: 'init', indexURL: PYODIDE_URL, files });
  ready.catch(() => (ready = null));
  return ready;
}

export async function runPython(code: string, tests?: TestSpec[]): Promise<RunResult> {
  await startPython();
  return call({ type: 'run', code, tests });
}

/** Dừng code chạy quá lâu: huỷ worker, lần chạy sau sẽ khởi động lại (mất biến cũ). */
export function stopPython() {
  worker?.terminate();
  worker = null;
  ready = null;
  for (const cb of pending.values()) cb({ ok: false, error: 'Đã dừng. Python sẽ khởi động lại ở lần chạy tiếp theo.' });
  pending.clear();
}
