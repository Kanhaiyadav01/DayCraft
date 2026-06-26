export function formatHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatLongHMS(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

export function formatStopwatch(totalMs: number): string {
  return formatLongHMS(Math.floor(totalMs / 1000));
}

export function formatStopwatchMs(totalMs: number): string {
  const cs = Math.floor((totalMs % 1000) / 10);
  return cs.toString().padStart(2, "0");
}

export function formatMS(totalMs: number): string {
  const totalCs = Math.max(0, Math.floor(totalMs / 10));
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const min = Math.floor(totalSec / 60);
  const pad = (n: number, w = 2) => n.toString().padStart(w, "0");
  return `${pad(min)}:${pad(sec)}.${pad(cs)}`;
}

export function formatRelative(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function computeStreak(runs: Array<{ created_at: string }>): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const key = (d: Date) => d.toISOString().slice(0, 10);
  const days = new Set(runs.map((r) => key(new Date(r.created_at))));
  let streak = 0;
  const cursor = new Date(today);
  while (days.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
