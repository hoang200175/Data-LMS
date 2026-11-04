/// <reference lib="webworker" />
// Chạy Python (Pyodide) trong Web Worker để trang không bị treo.
// Pyodide và các gói (pandas, numpy, matplotlib, scikit-learn...) tải từ CDN, trình duyệt cache lại sau lần đầu.

type RunMsg = { id: number; type: 'run'; code: string; tests?: { code: string; message: string; hidden?: boolean }[] };
type InitMsg = { id: number; type: 'init'; indexURL: string; files: { name: string; url: string }[] };

let pyodide: any = null;
let out: string[] = [];

const PRELUDE = `
import io, base64, sys
try:
    import matplotlib
    matplotlib.use("agg")
except ImportError:
    pass

def __collect_figures():
    if "matplotlib.pyplot" not in sys.modules:
        return []
    import matplotlib.pyplot as plt
    imgs = []
    for n in plt.get_fignums():
        buf = io.BytesIO()
        plt.figure(n).savefig(buf, format="png", bbox_inches="tight", dpi=110)
        imgs.append(base64.b64encode(buf.getvalue()).decode())
    plt.close("all")
    return imgs
`;

async function init(msg: InitMsg) {
  const { loadPyodide } = await import(/* @vite-ignore */ `${msg.indexURL}pyodide.mjs`);
  pyodide = await loadPyodide({ indexURL: msg.indexURL });
  pyodide.setStdout({ batched: (s: string) => out.push(s) });
  pyodide.setStderr({ batched: (s: string) => out.push(s) });
  for (const f of msg.files) {
    const res = await fetch(f.url);
    pyodide.FS.writeFile(f.name, new Uint8Array(await res.arrayBuffer()));
  }
}

function cleanError(e: any): string {
  const s = String(e?.message ?? e);
  // Bỏ phần traceback nội bộ của Pyodide, giữ lại phần liên quan tới code người học.
  const i = s.indexOf('File "<exec>"');
  return i >= 0 ? s.slice(i) : s;
}

async function run(msg: RunMsg) {
  out = [];
  const all = msg.code + '\n' + (msg.tests ?? []).map((t) => t.code).join('\n');
  await pyodide.loadPackagesFromImports(all, { messageCallback: () => {} });
  await pyodide.runPythonAsync(PRELUDE);
  let error: string | null = null;
  try {
    // Giống notebook: nếu dòng cuối là một biểu thức (ví dụ df.head()), in giá trị của nó ra.
    const value = await pyodide.runPythonAsync(msg.code);
    if (value !== undefined && value !== null) {
      out.push(String(value));
      value.destroy?.();
    }
  } catch (e) {
    error = cleanError(e);
  }
  const tests: { message: string; pass: boolean; hidden?: boolean; detail?: string }[] = [];
  if (msg.tests && !error) {
    for (const t of msg.tests) {
      try {
        await pyodide.runPythonAsync(t.code);
        tests.push({ message: t.message, pass: true, hidden: t.hidden });
      } catch (e) {
        tests.push({ message: t.message, pass: false, hidden: t.hidden, detail: cleanError(e).split('\n').filter(Boolean).pop() });
      }
    }
  }
  const images: string[] = (await pyodide.runPythonAsync('__collect_figures()')).toJs();
  return { stdout: out.join('\n'), error, tests, images };
}

self.onmessage = async (ev: MessageEvent<RunMsg | InitMsg>) => {
  const msg = ev.data;
  try {
    if (msg.type === 'init') {
      await init(msg);
      self.postMessage({ id: msg.id, ok: true });
    } else {
      self.postMessage({ id: msg.id, ok: true, result: await run(msg) });
    }
  } catch (e) {
    self.postMessage({ id: msg.id, ok: false, error: cleanError(e) });
  }
};
