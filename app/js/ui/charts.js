import { h, s } from '../dom.js';

const GAP = 0.9;

export function donut(slices, center) {
  const total = slices.reduce((sum, x) => sum + x.value, 0);
  const visible = slices.filter((x) => x.value > 0);
  const gap = visible.length > 1 ? GAP : 0;
  let offset = 0;

  return h('div', { className: 'donut' },
    s('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' },
      s('circle', { className: 'donut-track', cx: 60, cy: 60, r: 50, pathLength: 100 }),
      slices.map((x) => {
        const share = total ? (x.value / total) * 100 : 0;
        const length = Math.max(0, share - gap);
        const arc = s('circle', {
          'data-key': x.key, className: 'donut-arc', cx: 60, cy: 60, r: 50, pathLength: 100,
          stroke: x.color,
          style: { 'stroke-dasharray': `${length} ${100 - length}`, 'stroke-dashoffset': `${-offset}` },
        });
        offset += share;
        return arc;
      })),
    h('div', { className: 'donut-center' }, center));
}

export function columns(buckets, groups, label) {
  return h('div', { className: 'columns' },
    h('div', { className: 'columns-plot' }, buckets.map((b, i) => {
      const total = [...b.byGroup.values()].reduce((sum, ms) => sum + ms, 0);
      return h('div', { className: `column${b.future ? ' future' : ''}` },
        h('div', { className: 'column-fill', style: { transform: `scaleY(${Math.min(1, total / b.span)})` } },
          groups.map((g) => {
            const ms = b.byGroup.get(g.id) ?? 0;
            return h('span', { 'data-key': g.id, style: { 'flex-grow': ms, background: g.color } });
          })),
        label(b, i) !== null && h('span', { className: 'column-label' }, label(b, i)));
    })));
}

export const bar = (fraction, color) =>
  h('div', { className: 'bar' },
    h('span', { style: { transform: `scaleX(${Math.max(0, Math.min(1, fraction))})`, background: color } }));
