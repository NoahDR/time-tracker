import { runningEntry } from '../domain.js';
import { h } from '../dom.js';
import { HOUR, fromLocalInput, toLocalInput } from '../time.js';

function openSheet(title, fields, { onSave, onDelete }) {
  const error = h('p', { className: 'error' });
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const run = (fn) => {
    try {
      fn();
      close();
    } catch (e) {
      error.textContent = e.message;
    }
  };

  const dialog = h('dialog', { className: 'sheet' },
    h('form', { method: 'dialog', onSubmit: (e) => { e.preventDefault(); run(onSave); } },
      h('div', { className: 'sheet-head' },
        h('button', { type: 'button', className: 'link-btn', onClick: close }, 'Abbrechen'),
        h('h2', null, title),
        h('button', { type: 'submit', className: 'link-btn strong' }, 'Sichern')),
      fields,
      error,
      onDelete && h('button', {
        type: 'button', className: 'btn danger',
        onClick: () => confirm('Wirklich löschen?') && run(onDelete),
      }, 'Löschen')));

  dialog.addEventListener('click', (e) => e.target === dialog && close());
  document.body.append(dialog);
  dialog.showModal();
}

const field = (label, input) => h('label', { className: 'field' }, h('span', null, label), input);

function entrySheet(store, entry, isNew) {
  const category = h('select', null, store.state.categories
    .filter((c) => !c.archived || c.id === entry.categoryId)
    .map((c) => h('option', { value: c.id, selected: c.id === entry.categoryId }, `${c.icon} ${c.name}`)));
  const start = h('input', { type: 'datetime-local', value: toLocalInput(entry.start) });
  const end = h('input', { type: 'datetime-local', value: entry.end === null ? '' : toLocalInput(entry.end) });
  const canRun = entry.end === null || !runningEntry(store.state);

  openSheet(isNew ? 'Eintrag nachtragen' : 'Eintrag bearbeiten', [
    field('Bereich', category),
    field('Start', start),
    field(canRun ? 'Ende (leer = läuft noch)' : 'Ende', end),
  ], {
    onSave: () => {
      if (!start.value) throw new Error('Bitte einen Start angeben.');
      if (!end.value && !canRun) throw new Error('Bitte ein Ende angeben.');
      store.dispatch({
        type: 'saveEntry',
        entry: { ...entry, categoryId: category.value, start: fromLocalInput(start.value), end: end.value ? fromLocalInput(end.value) : null },
      });
    },
    onDelete: !isNew && (() => store.dispatch({ type: 'deleteEntry', id: entry.id })),
  });
}

export const editEntry = (store, entry) => entrySheet(store, entry, false);

export function newEntry(store, dayStart) {
  const start = Math.min(dayStart + 12 * HOUR, Date.now() - HOUR);
  const categoryId = store.state.categories.find((c) => !c.archived)?.id;
  entrySheet(store, { id: crypto.randomUUID(), categoryId, start, end: start + HOUR }, true);
}

export function editCategory(store, existing) {
  const category = existing ?? { id: crypto.randomUUID(), name: '', group: '', icon: '⭐', color: '#4A90D9', archived: false };
  const groups = [...new Set(store.state.categories.map((c) => c.group))];
  const name = h('input', { value: category.name, placeholder: 'z. B. Master Theologie', required: true });
  const icon = h('input', { value: category.icon, maxlength: 4, className: 'emoji' });
  const group = h('input', { value: category.group, list: 'groups', placeholder: 'z. B. Privates', required: true });
  const color = h('input', { type: 'color', value: category.color });
  const archived = h('input', { type: 'checkbox', checked: category.archived });

  openSheet(existing ? 'Bereich bearbeiten' : 'Neuer Bereich', [
    field('Name', name),
    field('Symbol', icon),
    field('Gruppe', group),
    h('datalist', { id: 'groups' }, groups.map((g) => h('option', { value: g }))),
    field('Farbe', color),
    existing && h('label', { className: 'field toggle' }, h('span', null, 'Archiviert (ausblenden, Daten bleiben)'), archived),
  ], {
    onSave: () => {
      const trimmed = { name: name.value.trim(), group: group.value.trim(), icon: icon.value.trim() || '•' };
      if (!trimmed.name || !trimmed.group) throw new Error('Name und Gruppe sind Pflicht.');
      store.dispatch({ type: 'saveCategory', category: { ...category, ...trimmed, color: color.value, archived: archived.checked } });
    },
  });
}
