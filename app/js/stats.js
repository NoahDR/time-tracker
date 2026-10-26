import { daysBetween } from './time.js';

export function segmentsIn(entries, from, to, now) {
  return entries
    .map((e) => ({ entry: e, start: Math.max(e.start, from), end: Math.min(e.end ?? now, to) }))
    .filter((s) => s.end > s.start || (s.entry.end === null && s.end === s.start && s.start < to))
    .sort((a, b) => a.start - b.start);
}

export function totalsByCategory(entries, from, to, now) {
  const totals = new Map();
  for (const s of segmentsIn(entries, from, to, now)) {
    totals.set(s.entry.categoryId, (totals.get(s.entry.categoryId) ?? 0) + s.end - s.start);
  }
  return totals;
}

export function summarize(state, range, now) {
  const totals = totalsByCategory(state.entries, range.from, range.to, now);
  const elapsedTo = Math.min(range.to, now);
  const days = Math.max(1, daysBetween(range.from, elapsedTo) + (elapsedTo < range.to ? 1 : 0));
  const rows = state.categories
    .map((category) => ({ category, ms: totals.get(category.id) ?? 0 }))
    .filter((r) => r.ms > 0 || !r.category.archived);

  const groups = new Map();
  for (const r of rows) groups.set(r.category.group, (groups.get(r.category.group) ?? 0) + r.ms);

  const tracked = rows.reduce((sum, r) => sum + r.ms, 0);
  const available = Math.max(0, elapsedTo - range.from);
  return { rows, groups, tracked, untracked: Math.max(0, available - tracked), days };
}
