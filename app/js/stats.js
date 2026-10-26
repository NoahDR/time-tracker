import { addDays, daysBetween } from './time.js';

export function segmentsIn(entries, from, to, now) {
  return entries
    .map((e) => ({ entry: e, start: Math.max(e.start, from), end: Math.min(e.end ?? now, to) }))
    .filter((s) => s.end > s.start || (s.entry.end === null && s.end === s.start && s.start < to))
    .sort((a, b) => a.start - b.start);
}

export function totalsByArea(entries, from, to, now) {
  const totals = new Map();
  for (const s of segmentsIn(entries, from, to, now)) {
    totals.set(s.entry.areaId, (totals.get(s.entry.areaId) ?? 0) + s.end - s.start);
  }
  return totals;
}

export function totalsByGroup(state, from, to, now) {
  const groupOf = new Map(state.areas.map((a) => [a.id, a.groupId]));
  const totals = new Map();
  for (const [areaId, ms] of totalsByArea(state.entries, from, to, now)) {
    const groupId = groupOf.get(areaId);
    totals.set(groupId, (totals.get(groupId) ?? 0) + ms);
  }
  return totals;
}

export function summarize(state, range, now) {
  const totals = totalsByArea(state.entries, range.from, range.to, now);
  const elapsedTo = Math.min(range.to, now);
  const days = Math.max(1, daysBetween(range.from, elapsedTo) + (elapsedTo < range.to ? 1 : 0));

  const groups = state.groups.map((group) => {
    const areas = state.areas
      .filter((a) => a.groupId === group.id)
      .map((area) => ({ area, ms: totals.get(area.id) ?? 0 }))
      .filter((r) => r.ms > 0 || !r.area.archived);
    return { group, areas, ms: areas.reduce((sum, r) => sum + r.ms, 0) };
  });

  const tracked = groups.reduce((sum, g) => sum + g.ms, 0);
  const available = Math.max(0, elapsedTo - range.from);
  return { groups, tracked, untracked: Math.max(0, available - tracked), days };
}

const STEPS = {
  day: (ms) => {
    const d = new Date(ms);
    d.setHours(d.getHours() + 1);
    return d.getTime();
  },
  week: (ms) => addDays(ms, 1),
  month: (ms) => addDays(ms, 1),
  year: (ms) => {
    const d = new Date(ms);
    d.setMonth(d.getMonth() + 1, 1);
    return d.getTime();
  },
};

export function bucketsOf(state, range, now) {
  const buckets = [];
  for (let from = range.from; from < range.to; ) {
    const to = Math.min(STEPS[range.kind](from), range.to);
    const span = Math.max(to - from, 1);
    buckets.push({ from, to, span, byGroup: totalsByGroup(state, from, to, now), future: from > now });
    from = to;
  }
  return buckets;
}
