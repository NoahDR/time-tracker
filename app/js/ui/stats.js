import { h } from '../dom.js';
import { summarize } from '../stats.js';
import { DAY, formatDuration, formatHours, rangeOf, shiftRange } from '../time.js';

const RANGE_KINDS = [['week', 'Woche'], ['month', 'Monat'], ['year', 'Jahr']];

const fmtDate = (ms, opts) => new Date(ms).toLocaleDateString('de-DE', opts);

function rangeLabel({ kind, from, to }) {
  if (kind === 'year') return fmtDate(from, { year: 'numeric' });
  if (kind === 'month') return fmtDate(from, { month: 'long', year: 'numeric' });
  return `${fmtDate(from, { day: 'numeric', month: 'short' })} – ${fmtDate(to - DAY, { day: 'numeric', month: 'short' })}`;
}

const metric = (label, value) =>
  h('div', { className: 'metric' }, h('span', null, label), h('strong', null, value));

export function statsView(store, now) {
  const range = store.ui.range;
  const summary = summarize(store.state, range, now);
  const isCurrent = range.to > now;
  const max = Math.max(1, ...summary.rows.map((r) => r.ms));
  const colorOf = new Map();
  for (const c of store.state.categories) if (!colorOf.has(c.group)) colorOf.set(c.group, c.color);

  return [
    h('header', { className: 'title' }, h('h1', null, 'Auswertung')),
    h('div', { className: 'segmented' }, RANGE_KINDS.map(([kind, label]) =>
      h('button', {
        className: kind === range.kind ? 'active' : '',
        onClick: () => store.setUi({ range: rangeOf(kind, now) }),
      }, label))),
    h('div', { className: 'day-nav' },
      h('button', { className: 'icon-btn', 'aria-label': 'Zurück', onClick: () => store.setUi({ range: shiftRange(range, -1) }) }, '‹'),
      h('h2', null, rangeLabel(range)),
      h('button', {
        className: 'icon-btn', 'aria-label': 'Weiter', disabled: isCurrent,
        onClick: () => store.setUi({ range: shiftRange(range, 1) }),
      }, '›')),
    h('section', { className: 'metrics' },
      metric('Erfasst', formatHours(summary.tracked)),
      metric('Ø pro Tag', formatHours(summary.tracked / summary.days)),
      metric('Nicht erfasst', formatHours(summary.untracked))),
    summary.tracked > 0 && h('section', { className: 'card' },
      h('div', { className: 'stack' }, [...summary.groups].filter(([, ms]) => ms > 0).map(([group, ms]) =>
        h('span', { title: group, style: { flex: ms, background: colorOf.get(group) } }))),
      h('ul', { className: 'legend' }, [...summary.groups].filter(([, ms]) => ms > 0).map(([group, ms]) =>
        h('li', null,
          h('span', { className: 'dot', style: { background: colorOf.get(group) } }),
          h('span', null, group),
          h('strong', null, `${Math.round((ms / summary.tracked) * 100)} %`))))),
    h('section', { className: 'card' },
      h('ul', { className: 'bars' }, summary.rows.map(({ category, ms }) =>
        h('li', null,
          h('div', { className: 'bar-head' },
            h('span', null, `${category.icon} ${category.name}`),
            h('span', { className: 'muted' }, ms ? `${formatDuration(ms)} · Ø ${formatDuration(ms / summary.days)}/Tag` : '–')),
          h('div', { className: 'bar' },
            h('span', { style: { width: `${(ms / max) * 100}%`, background: category.color } })))))),
  ];
}
