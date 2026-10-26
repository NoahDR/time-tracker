export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
export const DAY = 24 * HOUR;

export function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export const addDays = (ms, days) => {
  const d = new Date(ms);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

const RANGES = {
  day: {
    start: (ms) => startOfDay(ms),
    shift: (ms, n) => addDays(ms, n),
  },
  week: {
    start: (ms) => {
      const d = new Date(startOfDay(ms));
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      return d.getTime();
    },
    shift: (ms, n) => addDays(ms, 7 * n),
  },
  month: {
    start: (ms) => {
      const d = new Date(startOfDay(ms));
      d.setDate(1);
      return d.getTime();
    },
    shift: (ms, n) => {
      const d = new Date(ms);
      d.setMonth(d.getMonth() + n, 1);
      return d.getTime();
    },
  },
  year: {
    start: (ms) => {
      const d = new Date(startOfDay(ms));
      d.setMonth(0, 1);
      return d.getTime();
    },
    shift: (ms, n) => {
      const d = new Date(ms);
      d.setFullYear(d.getFullYear() + n, 0, 1);
      return d.getTime();
    },
  },
};

export function rangeOf(kind, ms) {
  const { start, shift } = RANGES[kind];
  const from = start(ms);
  return { kind, from, to: start(shift(from, 1)) };
}

export const shiftRange = (range, n) => rangeOf(range.kind, RANGES[range.kind].shift(range.from, n));

export const daysBetween = (from, to) => Math.round((startOfDay(to) - startOfDay(from)) / DAY);

const pad = (n) => String(n).padStart(2, '0');

export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}:${pad(m)}:${pad(total % 60)}`;
}

export function formatDuration(ms) {
  const minutes = Math.round(ms / MINUTE);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${pad(m)} min`;
}

export const formatHours = (ms) =>
  `${(ms / HOUR).toLocaleString('de-DE', { maximumFractionDigits: 1 })} h`;

export const formatTime = (ms) =>
  new Date(ms).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

export function toLocalInput(ms) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const fromLocalInput = (value) => new Date(value).getTime();
