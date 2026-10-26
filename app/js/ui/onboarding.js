import { h } from '../dom.js';
import { structureEditor } from './structure.js';

export function onboardingView(store) {
  const ready = store.state.areas.length > 0;
  return [
    h('header', { className: 'welcome' },
      h('img', { className: 'welcome-mark', src: 'icons/icon.svg', alt: '', width: 64, height: 64 }),
      h('h1', null, 'Dein Rhythmus.'),
      h('p', null, 'Bündle deine Zeit in Gruppen, zum Beispiel Privat oder Arbeit. Darin legst du die Bereiche an, die du tracken willst. Alles lässt sich später ändern.')),
    structureEditor(store, { suggestions: true }),
    h('div', { className: 'cta-bar' },
      h('button', {
        className: 'btn primary block', disabled: !ready,
        onClick: () => store.setUi({ setup: false, view: 'today' }),
      }, ready ? 'Los geht’s' : 'Lege mindestens einen Bereich an')),
  ];
}
