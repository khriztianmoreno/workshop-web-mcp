/**
 * Per-viewer persistence. Storage can be missing or throw (private windows,
 * blocked site data), so every access is guarded and the guide works without it.
 */
const PROGRESS_KEY = 'webmcp-guide:progress:v1';

export type Progress = Record<string, true>;

export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the guide still works, it just forgets */
  }
}

export function loadProgress(): Progress {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const progress: Progress = {};
    for (const [id, done] of Object.entries(parsed)) if (done === true) progress[id] = true;
    return progress;
  } catch {
    return {};
  }
}

export function saveProgress(progress: Progress): void {
  writePref(PROGRESS_KEY, JSON.stringify(progress));
}
