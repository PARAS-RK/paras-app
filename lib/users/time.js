const HOUR = 60 * 60 * 1000;
export const APPROVAL_WINDOW_MS = 24 * HOUR;

export const deadlineOf = (registration) => registration.submittedAt + APPROVAL_WINDOW_MS;

export function formatRemaining(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / HOUR);
  const m = Math.floor((abs % HOUR) / 60000);
  return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}

export function formatSubmitted(ts, now) {
  const diff = now - ts;
  if (diff < HOUR) return `${Math.max(1, Math.floor(diff / 60000))} menit lalu`;
  if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)} jam lalu`;
  return `${Math.floor(diff / (24 * HOUR))} hari lalu`;
}