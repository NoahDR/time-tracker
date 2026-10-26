import { h } from '../dom.js';
import { icon } from './icons.js';

export function segmented(options, active, onPick) {
  const index = Math.max(0, options.findIndex(([key]) => key === active));
  return h('div', { className: 'segmented', role: 'tablist', style: { '--n': options.length } },
    h('span', { className: 'segmented-indicator', style: { transform: `translateX(${index * 100}%)` } }),
    options.map(([key, label]) => h('button', {
      role: 'tab', 'aria-selected': String(key === active), className: key === active ? 'active' : '',
      onClick: () => onPick(key),
    }, label)));
}

export function stepper(label, { onPrev, onNext, canNext }) {
  return h('div', { className: 'stepper' },
    h('button', { className: 'icon-btn', 'aria-label': 'Zurück', onClick: onPrev }, icon('left', 20)),
    h('span', { className: 'stepper-label' }, label),
    h('button', { className: 'icon-btn', 'aria-label': 'Weiter', disabled: !canNext, onClick: onNext }, icon('right', 20)));
}

export function quickAdd(key, placeholder, onAdd) {
  return h('form', {
    className: 'quick-add', 'data-key': key,
    onSubmit: (e) => {
      e.preventDefault();
      const input = e.currentTarget.elements.name;
      const value = input.value.trim();
      if (!value) return;
      onAdd(value);
      input.value = '';
    },
  },
  h('input', { name: 'name', placeholder, enterkeyhint: 'done', autocomplete: 'off', 'aria-label': placeholder }),
  h('button', { type: 'submit', className: 'quick-add-btn', 'aria-label': 'Hinzufügen' }, icon('plus', 18)));
}

export const sectionTitle = (title, hint) =>
  h('div', { className: 'section-title' }, h('h2', null, title), hint && h('p', null, hint));
