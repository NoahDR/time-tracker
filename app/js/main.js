import { reduce } from './domain.js';
import { h, patch } from './dom.js';
import { load, save } from './storage.js';
import { formatClock, rangeOf } from './time.js';
import { icon } from './ui/icons.js';
import { onboardingView } from './ui/onboarding.js';
import { overviewView } from './ui/overview.js';
import { settingsView } from './ui/settings.js';
import { todayView } from './ui/today.js';

const VIEWS = {
  today: { label: 'Heute', icon: 'today', render: todayView },
  overview: { label: 'Übersicht', icon: 'chart', render: overviewView },
  settings: { label: 'Einstellungen', icon: 'settings', render: settingsView },
};

const root = document.getElementById('app');
const initial = load();

const store = {
  state: initial,
  ui: { view: 'today', setup: initial.areas.length === 0, day: Date.now(), range: rangeOf('week', Date.now()) },

  dispatch(action) {
    this.state = reduce(this.state, action);
    save(this.state);
    render();
  },

  setUi(patchUi) {
    this.ui = { ...this.ui, ...patchUi };
    render();
    if ('view' in patchUi) scrollTo({ top: 0 });
  },

  toast(message) {
    const el = h('div', { className: 'toast', role: 'status' }, message);
    document.body.append(el);
    setTimeout(() => el.classList.add('leaving'), 2600);
    setTimeout(() => el.remove(), 3000);
  },
};

function render() {
  const now = Date.now();
  const key = store.ui.setup ? 'setup' : store.ui.view;
  const view = store.ui.setup ? onboardingView(store) : VIEWS[store.ui.view].render(store, now);
  patch(root,
    h('main', { className: `view view-${key}`, 'data-key': key }, view),
    !store.ui.setup && h('nav', { className: 'tabbar', 'data-key': 'tabbar' },
      h('span', {
        className: 'tabbar-indicator',
        style: { transform: `translateX(${Object.keys(VIEWS).indexOf(store.ui.view) * 100}%)` },
      }),
      Object.entries(VIEWS).map(([name, v]) => h('button', {
        className: name === store.ui.view ? 'active' : '', 'aria-current': name === store.ui.view ? 'page' : null,
        onClick: () => store.setUi({ view: name }),
      }, icon(v.icon, 22), h('span', null, v.label)))));
}

function tick() {
  const now = Date.now();
  for (const el of root.querySelectorAll('[data-since]')) el.textContent = formatClock(now - Number(el.dataset.since));
}

render();
setInterval(tick, 1000);
setInterval(render, 30_000);
document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && render());
document.addEventListener('touchstart', () => {}, { passive: true });

navigator.storage?.persist?.();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
