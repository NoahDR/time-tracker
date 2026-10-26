import { h } from '../dom.js';
import { bucketsOf, summarize } from '../stats.js';
import { DAY, formatDuration, formatHours, rangeOf, shiftRange } from '../time.js';
import { bar, columns, donut } from './charts.js';
import { segmented, stepper } from './controls.js';

const KINDS = [['day', 'Tag'], ['week', 'Woche'], ['month', 'Monat'], ['year', 'Jahr']];

const fmt = (ms, opts) => new Date(ms).toLocaleDateString('de-DE', opts);

function rangeLabel({ kind, from, to }) {
  if (kind === 'day') return fmt(from, { weekday: 'short', day: 'numeric', month: 'long' });
  if (kind === 'year') return fmt(from, { year: 'numeric' });
  if (kind === 'month') return fmt(from, { month: 'long', year: 'numeric' });
  return `${fmt(from, { day: 'numeric', month: 'short' })} – ${fmt(to - DAY, { day: 'numeric', month: 'short' })}`;
}

const LABELS = {
  day: (b, i) => (i % 6 === 0 ? String(i) : null),
  week: (b) => fmt(b.from, { weekday: 'short' }).slice(0, 2),
  month: (b) => {
    const date = new Date(b.from).getDate();
    return (date - 1) % 7 === 0 ? String(date) : null;
  },
  year: (b) => fmt(b.from, { month: 'narrow' }),
};

const percent = (ms, total) => `${total ? Math.round((ms / total) * 100) : 0} %`;

const metric = (label, value) => h('div', { className: 'metric' }, h('span', null, label), h('strong', null, value));

export function overviewView(store, now) {
  const range = store.ui.range;
  const summary = summarize(store.state, range, now);
  const tracked = summary.groups.filter((g) => g.ms > 0);
  const allAreas = summary.groups.flatMap((g) => g.areas);
  const top = allAreas.reduce((best, r) => (r.ms > (best?.ms ?? 0) ? r : best), null);
  const maxArea = Math.max(1, ...allAreas.map((r) => r.ms));

  return [
    h('header', { className: 'page-head' }, h('p', { className: 'page-kicker' }, 'Auswertung'), h('h1', null, 'Übersicht')),
    segmented(KINDS, range.kind, (kind) => store.setUi({ range: rangeOf(kind, now) })),
    stepper(rangeLabel(range), {
      onPrev: () => store.setUi({ range: shiftRange(range, -1) }),
      onNext: () => store.setUi({ range: shiftRange(range, 1) }),
      canNext: range.to <= now,
    }),
    h('section', { className: 'card overview-hero' },
      donut(summary.groups.map((g) => ({ key: g.group.id, value: g.ms, color: g.group.color })), [
        h('strong', null, formatHours(summary.tracked)),
        h('span', null, 'erfasst'),
      ]),
      h('ul', { className: 'legend' }, tracked.length === 0
        ? h('li', { className: 'muted', 'data-key': 'empty' }, 'Noch nichts erfasst.')
        : tracked.map((g) => h('li', { 'data-key': g.group.id, style: { '--c': g.group.color } },
          h('span', { className: 'dot' }),
          h('span', { className: 'legend-text' },
            h('span', { className: 'legend-name' }, g.group.name),
            h('span', { className: 'legend-value' }, formatHours(g.ms))),
          h('span', { className: 'legend-share' }, percent(g.ms, summary.tracked)))))),
    h('section', { className: 'metrics' },
      metric('Ø pro Tag', formatHours(summary.tracked / summary.days)),
      metric('Nicht erfasst', formatHours(summary.untracked)),
      metric('Meiste Zeit', top ? top.area.name : '–')),
    h('section', { className: 'card' },
      h('h3', { className: 'card-title' }, 'Verlauf'),
      columns(bucketsOf(store.state, range, now), store.state.groups, LABELS[range.kind])),
    summary.groups.filter((g) => g.areas.length > 0).map((g) =>
      h('section', { className: 'card breakdown', 'data-key': g.group.id, style: { '--c': g.group.color } },
        h('header', { className: 'breakdown-head' },
          h('span', { className: 'dot' }),
          h('h3', null, g.group.name),
          h('span', null, `${formatHours(g.ms)} · ${percent(g.ms, summary.tracked)}`)),
        h('ul', { className: 'area-rows' }, g.areas.map(({ area, ms }) =>
          h('li', { 'data-key': area.id },
            h('div', { className: 'area-row-head' },
              h('span', null, area.icon ? `${area.icon} ${area.name}` : area.name),
              h('span', { className: 'muted' }, ms ? `${formatDuration(ms)} · Ø ${formatDuration(ms / summary.days)}` : '–')),
            bar(ms / maxArea, area.color)))))),
  ];
}
