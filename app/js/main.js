import { reduce } from './domain.js';
import { h } from './dom.js';
import { load, save } from './storage.js';
import { rangeOf, formatClock } from './time.js';
import { settingsView } from './ui/settings.js';
import { statsView } from './ui/stats.js';
import { todayView } from './ui/today.js';

const VIEWS = {
  today: { label: 'Heute', icon: '◷', render: todayView },
  stats: { label: 'Auswertung', icon: '▤', render: statsView },
  settings: { label: 'Einstellungen', icon: '⚙', render: settingsView },
};

const root = document.getElementById('app');

const store = {
  state: load(),
  ui: { view: 'today', day: Date.now(), range: rangeOf('week', Date.now()) },

  dispatch(action) {
    this.state = reduce(this.state, action);
    save(this.state);
    render();
  },

  setUi(patch) {
    this.ui = { ...this.ui, ...patch };
    render();
    if ('view' in patch) scrollTo(0, 0);
  },

  toast(message) {
    const el = h('div', { className: 'toast', role: 'status' }, message);
    document.body.append(el);
    setTimeout(() => el.remove(), 3000);
  },
};

function render() {
  const now = Date.now();
  root.replaceChildren(
    h('main', null, VIEWS[store.ui.view].render(store, now)),
    h('nav', { className: 'tabbar' }, Object.entries(VIEWS).map(([key, view]) =>
      h('button', { className: key === store.ui.view ? 'active' : '', onClick: () => store.setUi({ view: key }) },
        h('span', { className: 'tab-icon' }, view.icon), h('span', null, view.label)))),
  );
}

function tick() {
  const now = Date.now();
  for (const el of root.querySelectorAll('[data-since]')) el.textContent = formatClock(now - Number(el.dataset.since));
}

render();
setInterval(tick, 1000);
setInterval(render, 60_000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && render());

navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
