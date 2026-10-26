import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, runningEntry } from '../app/js/domain.js';
import { load, parseState, toExport } from '../app/js/storage.js';
import { bucketsOf, segmentsIn, summarize, totalsByArea } from '../app/js/stats.js';
import { HOUR, rangeOf, shiftRange } from '../app/js/time.js';

const T0 = new Date(2026, 9, 26, 8, 0).getTime();

const STRUCTURE = [
  { type: 'saveGroup', group: { id: 'private', name: 'Privat', color: '#8B7CF6' } },
  { type: 'saveGroup', group: { id: 'job', name: 'Arbeit', color: '#5B9CF6' } },
  { type: 'saveArea', area: { id: 'family', name: 'Familie', groupId: 'private', color: '#8B7CF6', icon: '', archived: false } },
  { type: 'saveArea', area: { id: 'sleep', name: 'Schlafen', groupId: 'private', color: '#8B7CF6', icon: '', archived: false } },
  { type: 'saveArea', area: { id: 'work', name: 'Arbeit', groupId: 'job', color: '#5B9CF6', icon: '', archived: false } },
];

const run = (...actions) => [...STRUCTURE, ...actions].reduce(reduce, initialState());

test('a fresh install starts without any groups or areas', () => {
  assert.deepEqual(initialState(), { version: 2, groups: [], areas: [], entries: [] });
});

test('starting an area switches away from the running one', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 }, { type: 'start', areaId: 'family', at: T0 + HOUR });
  assert.equal(state.entries.length, 2);
  assert.equal(state.entries[0].end, T0 + HOUR);
  assert.equal(runningEntry(state).areaId, 'family');
});

test('starting the running area again changes nothing', () => {
  const once = run({ type: 'start', areaId: 'work', at: T0 });
  assert.equal(reduce(once, { type: 'start', areaId: 'work', at: T0 + HOUR }), once);
});

test('stop closes the running entry', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 }, { type: 'stop', at: T0 + 2 * HOUR });
  assert.equal(runningEntry(state), null);
  assert.equal(state.entries[0].end, T0 + 2 * HOUR);
});

test('saveEntry rejects an end before the start and a second running entry', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 });
  const entry = { id: 'x', areaId: 'family', start: T0 };
  assert.throws(() => reduce(state, { type: 'saveEntry', entry: { ...entry, end: T0 - 1 } }));
  assert.throws(() => reduce(state, { type: 'saveEntry', entry: { ...entry, end: null } }));
});

test('a group with areas and an area with entries cannot be deleted', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 });
  assert.throws(() => reduce(state, { type: 'deleteGroup', id: 'job' }), /enthält noch Bereiche/);
  assert.throws(() => reduce(state, { type: 'deleteArea', id: 'work' }), /Archiviere/);
  const withoutSleep = reduce(state, { type: 'deleteArea', id: 'sleep' });
  assert.deepEqual(withoutSleep.areas.map((a) => a.id), ['family', 'work']);
});

test('names are required and trimmed', () => {
  assert.throws(() => run({ type: 'saveGroup', group: { id: 'g', name: '  ', color: '#8B7CF6' } }), /Namen/);
  const state = run({ type: 'saveGroup', group: { id: 'g', name: '  Gemeinde ', color: '#8B7CF6' } });
  assert.equal(state.groups.at(-1).name, 'Gemeinde');
});

test('moving an area only reorders it within its group', () => {
  const state = run({ type: 'moveArea', id: 'sleep', delta: -1 });
  assert.deepEqual(state.areas.map((a) => a.id), ['sleep', 'family', 'work']);
  assert.equal(reduce(state, { type: 'moveArea', id: 'family', delta: 1 }).areas.at(-1).id, 'work');
});

test('totals clip entries that cross midnight to the requested day', () => {
  const evening = new Date(2026, 9, 26, 22, 0).getTime();
  const state = run({ type: 'start', areaId: 'sleep', at: evening }, { type: 'stop', at: evening + 8 * HOUR });
  const day = rangeOf('day', evening);
  assert.equal(totalsByArea(state.entries, day.from, day.to, evening + 9 * HOUR).get('sleep'), 2 * HOUR);
  const next = shiftRange(day, 1);
  assert.equal(totalsByArea(state.entries, next.from, next.to, evening + 9 * HOUR).get('sleep'), 6 * HOUR);
});

test('summaries count a running entry up to now and roll areas into groups', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 });
  const summary = summarize(state, rangeOf('day', T0), T0 + 3 * HOUR);
  assert.equal(summary.tracked, 3 * HOUR);
  assert.equal(summary.groups.find((g) => g.group.id === 'job').ms, 3 * HOUR);
});

test('a just-started entry shows up in the day log', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 });
  const day = rangeOf('day', T0);
  assert.equal(segmentsIn(state.entries, day.from, day.to, T0).length, 1);
});

test('chart buckets cover a range in hours, days or months', () => {
  const state = run({ type: 'start', areaId: 'work', at: T0 }, { type: 'stop', at: T0 + 2 * HOUR });
  const count = (kind) => bucketsOf(state, rangeOf(kind, T0), T0).length;
  assert.equal(count('day'), 24);
  assert.equal(count('week'), 7);
  assert.equal(count('month'), 31);
  assert.equal(count('year'), 12);
  const monday = bucketsOf(state, rangeOf('week', T0), T0 + 3 * HOUR)[0];
  assert.equal(monday.byGroup.get('job'), 2 * HOUR);
});

test('week ranges start on Monday', () => {
  const week = rangeOf('week', T0);
  assert.equal(new Date(week.from).getDay(), 1);
  assert.equal(new Date(week.to).getDay(), 1);
});

test('export round-trips through import', () => {
  const state = run({ type: 'start', areaId: 'family', at: T0 }, { type: 'start', areaId: 'work', at: T0 + HOUR });
  const json = JSON.parse(JSON.stringify(toExport(state, T0 + 2 * HOUR)));
  assert.equal(json.entries[0].durationMinutes, 60);
  assert.equal(json.entries[0].group, 'Privat');
  assert.deepEqual(parseState(json), state);
});

test('a version 1 backup migrates into groups and areas', () => {
  const v1 = {
    format: 'time-tracker-export',
    version: 1,
    categories: [
      { id: 'sleep', name: 'Schlafen', group: 'Basis', icon: '😴', color: '#6C7BD9', archived: false },
      { id: 'prayer', name: 'Gebet', group: 'Rule of Life', icon: '🙏', color: '#A78BDA', archived: false },
    ],
    entries: [{ id: 'e1', categoryId: 'prayer', start: '2026-10-26T06:00:00.000Z', end: '2026-10-26T06:20:00.000Z' }],
  };
  const state = parseState(v1);
  assert.deepEqual(state.groups.map((g) => g.name), ['Basis', 'Rule of Life']);
  assert.equal(state.areas.find((a) => a.id === 'prayer').groupId, state.groups[1].id);
  assert.equal(state.entries[0].areaId, 'prayer');
});

test('import rejects entries that reference unknown areas', () => {
  const data = { version: 2, groups: [], areas: [], entries: [{ id: 'a', areaId: 'nope', start: T0, end: null }] };
  assert.throws(() => parseState(data), /unbekannter Bereich/);
});

test('unreadable saved state is kept aside instead of being overwritten', () => {
  const data = new Map([['time-tracker/state', '{broken']]);
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  assert.deepEqual(load(storage), initialState());
  assert.ok([...data].some(([k, v]) => k.startsWith('time-tracker/state/unreadable-') && v === '{broken'));
});
