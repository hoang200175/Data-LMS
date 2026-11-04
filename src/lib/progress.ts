// Lưu tiến độ trên máy người học. Bản khung dùng localStorage; bản sau chuyển sang IndexedDB.
const KEY = 'data-lms:progress:v1';

export type Progress = { done: Record<string, boolean>; code: Record<string, string> };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { done: {}, code: {} };
}

export function saveProgress(p: Progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function update(fn: (p: Progress) => void) {
  const p = loadProgress();
  fn(p);
  saveProgress(p);
  window.dispatchEvent(new CustomEvent('data-lms:progress'));
}
