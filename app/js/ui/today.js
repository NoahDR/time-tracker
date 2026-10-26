import { categoryById, groupedCategories, runningEntry } from '../domain.js';
import { h } from '../dom.js';
import { segmentsIn, totalsByCategory } from '../stats.js';
import { formatClock, formatDuration, formatTime, rangeOf, shiftRange } from '../time.js';
import { editEntry, newEntry } from './sheets.js';

const dayLabel = (ms) =>
  new Date(ms).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

function nowCard(store, now) {
  const running = runningEntry(store.state);
  if (!running) {
    return h('section', { className: 'now idle' },
      h('div', { className: 'now-label' }, 'Gerade läuft nichts'),
      h('div', { className: 'now-hint' }, 'Tippe auf einen Bereich, um zu starten.'));
  }
  const category = categoryById(store.state, running.categoryId);
  return h('section', { className: 'now', style: { '--c': category.color } },
    h('div', { className: 'now-icon' }, category.icon),
    h('div', { className: 'now-body' },
      h('div', { className: 'now-label' }, `${category.name} seit ${formatTime(running.start)}`),
      h('div', { className: 'now-clock', 'data-since': running.start }, formatClock(now - running.start))),
    h('button', {
      className: 'stop', 'aria-label': 'Stoppen',
      onClick: () => store.dispatch({ type: 'stop', at: Date.now() }),
    }, h('span')));
}

function tiles(store, now) {
  const running = runningEntry(store.state);
  const today = rangeOf('day', now);
  const totals = totalsByCategory(store.state.entries, today.from, today.to, now);
  const active = store.state.categories.filter((c) => !c.archived);

  return [...groupedCategories(active)].map(([group, categories]) =>
    h('section', { className: 'group' },
      h('h2', null, group),
      h('div', { className: 'tiles' }, categories.map((c) => {
        const isRunning = running?.categoryId === c.id;
        return h('button', {
          className: `tile${isRunning ? ' running' : ''}`,
          style: { '--c': c.color },
          onClick: () => store.dispatch({ type: 'start', categoryId: c.id, at: Date.now() }),
        },
        h('span', { className: 'tile-icon' }, c.icon),
        h('span', { className: 'tile-name' }, c.name),
        h('span', { className: 'tile-total' }, totals.has(c.id) ? formatDuration(totals.get(c.id)) : '–'),
        h('span', { className: 'tile-play' }, isRunning ? '●' : '▶'));
      }))));
}

function timeline(store, day, now) {
  const segments = segmentsIn(store.state.entries, day.from, day.to, now);
  const span = day.to - day.from;
  return h('div', { className: 'timeline' },
    h('div', { className: 'timeline-bar' }, segments.map((s) => {
      const c = categoryById(store.state, s.entry.categoryId);
      return h('span', {
        title: c.name,
        style: {
          left: `${((s.start - day.from) / span) * 100}%`,
          width: `${((s.end - s.start) / span) * 100}%`,
          background: c.color,
        },
      });
    })),
    h('div', { className: 'timeline-ticks' }, ['0', '6', '12', '18', '24'].map((t) => h('span', null, t))));
}

function dayLog(store, now) {
  const day = rangeOf('day', store.ui.day);
  const segments = segmentsIn(store.state.entries, day.from, day.to, now).reverse();
  const isToday = day.from === rangeOf('day', now).from;

  return h('section', { className: 'card' },
    h('div', { className: 'day-nav' },
      h('button', { className: 'icon-btn', 'aria-label': 'Vorheriger Tag', onClick: () => store.setUi({ day: shiftRange(day, -1).from }) }, '‹'),
      h('h2', null, isToday ? 'Heute' : dayLabel(day.from)),
      h('button', {
        className: 'icon-btn', 'aria-label': 'Nächster Tag', disabled: isToday,
        onClick: () => store.setUi({ day: shiftRange(day, 1).from }),
      }, '›')),
    timeline(store, day, now),
    segments.length === 0
      ? h('p', { className: 'empty' }, 'Noch keine Einträge an diesem Tag.')
      : h('ul', { className: 'log' }, segments.map((s) => {
        const c = categoryById(store.state, s.entry.categoryId);
        return h('li', { onClick: () => editEntry(store, s.entry) },
          h('span', { className: 'dot', style: { background: c.color } }),
          h('span', { className: 'log-name' }, `${c.icon} ${c.name}`),
          h('span', { className: 'log-time' }, `${formatTime(s.start)}–${s.entry.end === null ? 'jetzt' : formatTime(s.end)}`),
          h('span', { className: 'log-dur' }, formatDuration(s.end - s.start)));
      })),
    h('button', { className: 'link-btn', onClick: () => newEntry(store, day.from) }, '+ Eintrag nachtragen'));
}

export function todayView(store, now) {
  return [
    h('header', { className: 'title' }, h('h1', null, 'Rhythmus'), h('p', null, dayLabel(now))),
    nowCard(store, now),
    tiles(store, now),
    dayLog(store, now),
  ];
}
