import { s } from '../dom.js';

const PATHS = {
  play: 'M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z',
  stop: 'M7 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  today: 'M12 3v2m0 14v2M5.6 5.6 7 7m10 10 1.4 1.4M3 12h2m14 0h2M5.6 18.4 7 17m10-10 1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  chart: 'M5 20V11m7 9V4m7 16v-6',
  settings: 'M4 7h9m4 0h3M4 17h3m4 0h9M15 4.5v5M9 14.5v5',
  plus: 'M12 5v14M5 12h14',
  left: 'm15 18-6-6 6-6',
  right: 'm9 6 6 6-6 6',
  up: 'm6 15 6-6 6 6',
  down: 'm6 9 6 6 6-6',
};

const FILLED = new Set(['play', 'stop']);

export function icon(name, size = 22) {
  const filled = FILLED.has(name);
  return s('svg', {
    viewBox: '0 0 24 24', width: size, height: size, 'aria-hidden': 'true', className: `icon icon-${name}`,
    fill: filled ? 'currentColor' : 'none', stroke: filled ? 'none' : 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
  }, s('path', { d: PATHS[name] }));
}
