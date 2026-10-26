import { areaById, areasOf, groupById, runningEntry } from '../domain.js';
import { h } from '../dom.js';
import { segmentsIn, totalsByArea } from '../stats.js';
import { formatClock, formatDuration, formatHours, formatTime, rangeOf, shiftRange } from '../time.js';
import { stepper } from './controls.js';
import { icon } from './icons.js';
import { editEntry, newEntry } from './sheets.js';

const dayLabel = (ms) => new Date(ms).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function greeting(now) {
  const hour = new Date(now).getHours();
  if (hour < 5) return 'Gute Nacht';
  if (hour < 11) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  if (hour < 22) return 'Guten Abend';
  return 'Gute Nacht';
}

const areaLabel = (area) => [area.icon && h('span', { className: 'emoji' }, area.icon), area.name];

function dayStrip(store, day, now) {
  const span = day.to - day.from;
  const pct = (ms) => `${((ms - day.from) / span) * 100}%`;
  return h('div', { className: 'strip' },
    h('div', { className: 'strip-track' },
      segmentsIn(store.state.entries, day.from, day.to, now).map((s) => h('span', {
        'data-key': s.entry.id,
        style: { left: pct(s.start), width: pct(day.from + s.end - s.start), background: areaById(store.state, s.entry.areaId)?.color },
      })),
      now < day.to && h('i', { className: 'strip-now', 'data-key': 'now', style: { left: pct(now) } })),
    h('div', { className: 'strip-ticks' }, ['0', '6', '12', '18', '24'].map((t) => h('span', null, t))));
}

function hero(store, now, todayTotal) {
  const running = runningEntry(store.state);
  const area = running && areaById(store.state, running.areaId);
  const group = area && groupById(store.state, area.groupId);
  const today = rangeOf('day', now);

  return h('section', { className: `hero${running ? ' live' : ''}`, style: { '--c': area?.color ?? 'var(--accent)' } },
    h('div', { className: 'hero-glow' }),
    h('div', { className: 'hero-eyebrow' },
      running && h('span', { className: 'live-dot', 'data-key': 'dot' }),
      running ? `Läuft · ${group?.name ?? ''}` : 'Heute erfasst'),
    running && h('div', { className: 'hero-title', 'data-key': 'title' }, areaLabel(area)),
    h('div', { className: 'hero-row' },
      h('div', { className: 'hero-clock', 'data-since': running?.start },
        running ? formatClock(now - running.start) : formatHours(todayTotal)),
      running && h('button', {
        className: 'hero-stop', 'data-key': 'stop', 'aria-label': 'Stoppen',
        onClick: () => store.dispatch({ type: 'stop', at: Date.now() }),
      }, icon('stop', 22))),
    h('p', { className: 'hero-sub' },
      running ? `seit ${formatTime(running.start)} · heute ${formatDuration(todayTotal)}` : 'Tippe auf einen Bereich, um zu starten.'),
    dayStrip(store, today, now));
}

function pill(store, area, running, total, now) {
  const isRunning = running?.areaId === area.id;
  return h('button', {
    className: `pill${isRunning ? ' running' : ''}`, 'data-key': area.id, style: { '--c': area.color },
    'aria-pressed': String(isRunning),
    onClick: () => store.dispatch(isRunning ? { type: 'stop', at: Date.now() } : { type: 'start', areaId: area.id, at: Date.now() }),
  },
  area.icon ? h('span', { className: 'pill-icon' }, area.icon) : h('span', { className: 'dot' }),
  h('span', { className: 'pill-name' }, area.name),
  h('span', { className: 'pill-meta', 'data-since': isRunning ? running.start : null },
    isRunning ? formatClock(now - running.start) : total ? formatDuration(total) : ''),
  h('span', { className: 'pill-action' }, icon('play', 16), icon('stop', 14)));
}

function history(store, now) {
  const day = rangeOf('day', store.ui.day);
  const isToday = day.from === rangeOf('day', now).from;
  const segments = segmentsIn(store.state.entries, day.from, day.to, now).reverse();

  return h('section', { className: 'history' },
    stepper(isToday ? 'Heute' : dayLabel(day.from), {
      onPrev: () => store.setUi({ day: shiftRange(day, -1).from }),
      onNext: () => store.setUi({ day: shiftRange(day, 1).from }),
      canNext: !isToday,
    }),
    !isToday && dayStrip(store, day, now),
    segments.length === 0
      ? h('p', { className: 'empty', 'data-key': 'empty' }, 'Keine Einträge an diesem Tag.')
      : h('ul', { className: 'entries', 'data-key': 'entries' }, segments.map((s) => {
        const area = areaById(store.state, s.entry.areaId);
        return h('li', { 'data-key': s.entry.id },
          h('button', { className: 'entry', style: { '--c': area.color }, onClick: () => editEntry(store, s.entry) },
            h('span', { className: 'dot' }),
            h('span', { className: 'entry-name' }, areaLabel(area)),
            h('span', { className: 'entry-time' }, `${formatTime(s.start)} – ${s.entry.end === null ? 'jetzt' : formatTime(s.end)}`),
            h('span', { className: 'entry-dur' }, formatDuration(s.end - s.start))));
      })),
    h('button', { className: 'ghost-btn', onClick: () => newEntry(store, day.from) }, icon('plus', 16), 'Eintrag nachtragen'));
}

export function todayView(store, now) {
  const running = runningEntry(store.state);
  const today = rangeOf('day', now);
  const totals = totalsByArea(store.state.entries, today.from, today.to, now);
  const todayTotal = [...totals.values()].reduce((sum, ms) => sum + ms, 0);

  return [
    h('header', { className: 'page-head' },
      h('p', { className: 'page-kicker' }, dayLabel(now)),
      h('h1', null, greeting(now))),
    hero(store, now, todayTotal),
    store.state.groups.map((group) => {
      const areas = areasOf(store.state, group.id);
      if (areas.length === 0) return null;
      const groupTotal = areas.reduce((sum, a) => sum + (totals.get(a.id) ?? 0), 0);
      return h('section', { className: 'group', 'data-key': group.id },
        h('header', { className: 'group-head' },
          h('h2', null, group.name),
          h('span', null, groupTotal ? formatDuration(groupTotal) : '')),
        h('div', { className: 'pills' }, areas.map((a) => pill(store, a, running, totals.get(a.id), now))));
    }),
    history(store, now),
  ];
}
