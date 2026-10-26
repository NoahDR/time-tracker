import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, runningEntry } from '../app/js/domain.js';
import { load, parseState, toExport } from '../app/js/storage.js';
import { segmentsIn, summarize, totalsByCategory } from '../app/js/stats.js';
import { HOUR, rangeOf, shiftRange } from '../app/js/time.js';

const T0 = new Date(2026, 9, 26, 8, 0).getTime();

const run = (...actions) => actions.reduce(reduce, initialState());

test('starting a category switches away from the running one', () => {
  const state = run(
    { type: 'start', categoryId: 'work', at: T0 },
    { type: 'start', categoryId: 'food', at: T0 + HOUR },
  );
  assert.equal(state.entries.length, 2);
  assert.equal(state.entries[0].end, T0 + HOUR);
  assert.equal(runningEntry(state).categoryId, 'food');
});

test('starting the running category again changes nothing', () => {
  const once = run({ type: 'start', categoryId: 'work', at: T0 });
  assert.equal(reduce(once, { type: 'start', categoryId: 'work', at: T0 + HOUR }), once);
});

test('stop closes the running entry and leaves nothing running', () => {
  const state = run({ type: 'start', categoryId: 'work', at: T0 }, { type: 'stop', at: T0 + 2 * HOUR });
  assert.equal(runningEntry(state), null);
  assert.equal(state.entries[0].end, T0 + 2 * HOUR);
});

test('saveEntry rejects an end before the start and a second running entry', () => {
  const state = run({ type: 'start', categoryId: 'work', at: T0 });
  assert.throws(() =>
    reduce(state, { type: 'saveEntry', entry: { id: 'x', categoryId: 'food', start: T0, end: T0 - 1 } }),
  );
  assert.throws(() =>
    reduce(state, { type: 'saveEntry', entry: { id: 'x', categoryId: 'food', start: T0, end: null } }),
  );
});

test('totals clip entries that cross midnight to the requested day', () => {
  const evening = new Date(2026, 9, 26, 22, 0).getTime();
  const state = run({ type: 'start', categoryId: 'sleep', at: evening }, { type: 'stop', at: evening + 8 * HOUR });
  const day = rangeOf('day', evening);
  assert.equal(totalsByCategory(state.entries, day.from, day.to, evening + 9 * HOUR).get('sleep'), 2 * HOUR);
  const next = shiftRange(day, 1);
  assert.equal(totalsByCategory(state.entries, next.from, next.to, evening + 9 * HOUR).get('sleep'), 6 * HOUR);
});

test('a running entry counts up to now', () => {
  const state = run({ type: 'start', categoryId: 'work', at: T0 });
  const summary = summarize(state, rangeOf('day', T0), T0 + 3 * HOUR);
  assert.equal(summary.tracked, 3 * HOUR);
  assert.equal(summary.groups.get('Basis'), 3 * HOUR);
});

test('week ranges start on Monday', () => {
  const week = rangeOf('week', T0);
  assert.equal(new Date(week.from).getDay(), 1);
  assert.equal(new Date(week.to).getDay(), 1);
});

test('export round-trips through import', () => {
  const state = run(
    { type: 'start', categoryId: 'prayer', at: T0 },
    { type: 'start', categoryId: 'work', at: T0 + HOUR },
  );
  const json = JSON.parse(JSON.stringify(toExport(state, T0 + 2 * HOUR)));
  assert.equal(json.entries[0].durationMinutes, 60);
  assert.deepEqual(parseState(json), state);
});

test('import rejects entries that reference unknown categories', () => {
  const data = { version: 1, categories: [], entries: [{ id: 'a', categoryId: 'nope', start: T0, end: null }] };
  assert.throws(() => parseState(data), /unbekannter Bereich/);
});

test('a just-started entry shows up in the day log', () => {
  const state = run({ type: 'start', categoryId: 'work', at: T0 });
  const day = rangeOf('day', T0);
  assert.equal(segmentsIn(state.entries, day.from, day.to, T0).length, 1);
});

test('unreadable saved state is kept aside instead of being overwritten', () => {
  const data = new Map([['time-tracker/state', '{broken']]);
  const storage = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  assert.deepEqual(load(storage), initialState());
  assert.ok([...data].some(([k, v]) => k.startsWith('time-tracker/state/unreadable-') && v === '{broken'));
});
