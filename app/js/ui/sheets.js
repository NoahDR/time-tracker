import { PALETTE, areasOf, groupById, nextColor, runningEntry } from '../domain.js';
import { h } from '../dom.js';
import { HOUR, fromLocalInput, toLocalInput } from '../time.js';
import { icon } from './icons.js';

const CLOSE_MS = 240;

function openSheet(title, fields, { onSave, onDelete, deleteLabel = 'Löschen' }) {
  const error = h('p', { className: 'sheet-error', role: 'alert' });
  let closing = false;

  const close = () => {
    if (closing) return;
    closing = true;
    dialog.classList.add('closing');
    setTimeout(() => {
      dialog.close();
      dialog.remove();
    }, CLOSE_MS);
  };
  const run = (fn) => {
    try {
      fn();
      close();
    } catch (e) {
      error.textContent = e.message;
    }
  };

  const dialog = h('dialog', { className: 'sheet', 'aria-label': title },
    h('form', { onSubmit: (e) => { e.preventDefault(); run(onSave); } },
      h('div', { className: 'sheet-grabber' }),
      h('div', { className: 'sheet-head' },
        h('button', { type: 'button', className: 'text-btn', onClick: close }, 'Abbrechen'),
        h('h2', null, title),
        h('button', { type: 'submit', className: 'text-btn strong' }, 'Sichern')),
      h('div', { className: 'sheet-body' }, fields),
      error,
      onDelete && h('button', {
        type: 'button', className: 'btn danger block',
        onClick: () => confirm('Wirklich löschen?') && run(onDelete),
      }, deleteLabel)));

  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  document.body.append(dialog);
  dialog.showModal();
}

const field = (label, control) => h('label', { className: 'field' }, h('span', { className: 'field-label' }, label), control);

function swatches(name, selected) {
  return h('div', { className: 'swatches', role: 'radiogroup' }, PALETTE.map((color) =>
    h('label', { className: 'swatch-option', style: { '--c': color } },
      h('input', { type: 'radio', name, value: color, checked: color === selected, 'aria-label': color }),
      h('span'))));
}

const choice = (form, name) => form.querySelector(`input[name="${name}"]:checked`)?.value;

function mover(onMove) {
  return h('div', { className: 'mover' },
    h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Nach oben', onClick: () => onMove(-1) }, icon('up', 18)),
    h('button', { type: 'button', className: 'icon-btn', 'aria-label': 'Nach unten', onClick: () => onMove(1) }, icon('down', 18)));
}

export function editGroup(store, existing) {
  const group = existing ?? { id: crypto.randomUUID(), name: '', color: nextColor(store.state.groups) };
  const name = h('input', { value: group.name, placeholder: 'z. B. Privat', autofocus: !existing, enterkeyhint: 'done' });
  const hasAreas = existing && areasOf(store.state, group.id, { archived: true }).length > 0;

  openSheet(existing ? 'Gruppe bearbeiten' : 'Neue Gruppe', [
    field('Name', name),
    field('Farbe', swatches('group-color', group.color)),
    existing && field('Position', mover((delta) => store.dispatch({ type: 'moveGroup', id: group.id, delta }))),
    hasAreas && h('p', { className: 'hint' }, 'Zum Löschen zuerst alle Bereiche dieser Gruppe verschieben oder löschen.'),
  ], {
    onSave: () => store.dispatch({
      type: 'saveGroup',
      group: { ...group, name: name.value, color: choice(name.form, 'group-color') ?? group.color },
    }),
    onDelete: existing && !hasAreas && (() => store.dispatch({ type: 'deleteGroup', id: group.id })),
  });
}

export function editArea(store, existing, groupId) {
  const group = groupById(store.state, existing?.groupId ?? groupId) ?? store.state.groups[0];
  const area = existing ?? { id: crypto.randomUUID(), name: '', groupId: group.id, color: group.color, icon: '', archived: false };
  const name = h('input', { value: area.name, placeholder: 'z. B. Familienzeit', autofocus: !existing, enterkeyhint: 'done' });
  const emoji = h('input', { value: area.icon, placeholder: 'optional', maxlength: 4, className: 'emoji-input' });
  const archived = h('input', { type: 'checkbox', className: 'switch', checked: area.archived });
  const hasEntries = existing && store.state.entries.some((e) => e.areaId === area.id);

  const groupChips = h('div', { className: 'chips', role: 'radiogroup' }, store.state.groups.map((g) =>
    h('label', { className: 'chip', style: { '--c': g.color } },
      h('input', { type: 'radio', name: 'area-group', value: g.id, checked: g.id === area.groupId }),
      h('span', null, g.name))));

  openSheet(existing ? 'Bereich bearbeiten' : 'Neuer Bereich', [
    field('Name', name),
    field('Gruppe', groupChips),
    field('Farbe', swatches('area-color', area.color)),
    field('Symbol', emoji),
    existing && field('Position', mover((delta) => store.dispatch({ type: 'moveArea', id: area.id, delta }))),
    existing && h('label', { className: 'field row' },
      h('span', null, h('span', { className: 'field-label' }, 'Archivieren'), h('span', { className: 'hint' }, 'Ausblenden, Einträge bleiben erhalten.')),
      archived),
  ], {
    onSave: () => store.dispatch({
      type: 'saveArea',
      area: {
        ...area,
        name: name.value,
        icon: emoji.value.trim(),
        groupId: choice(name.form, 'area-group') ?? area.groupId,
        color: choice(name.form, 'area-color') ?? area.color,
        archived: archived.checked,
      },
    }),
    onDelete: existing && !hasEntries && (() => store.dispatch({ type: 'deleteArea', id: area.id })),
  });
}

function entrySheet(store, entry, isNew) {
  const options = store.state.groups.map((g) =>
    h('optgroup', { label: g.name }, store.state.areas
      .filter((a) => a.groupId === g.id && (!a.archived || a.id === entry.areaId))
      .map((a) => h('option', { value: a.id, selected: a.id === entry.areaId }, `${a.icon ? `${a.icon} ` : ''}${a.name}`))));
  const area = h('select', null, options);
  const start = h('input', { type: 'datetime-local', value: toLocalInput(entry.start) });
  const end = h('input', { type: 'datetime-local', value: entry.end === null ? '' : toLocalInput(entry.end) });
  const canRun = entry.end === null || !runningEntry(store.state);

  openSheet(isNew ? 'Eintrag nachtragen' : 'Eintrag bearbeiten', [
    field('Bereich', area),
    h('div', { className: 'field-pair' }, field('Start', start), field(canRun ? 'Ende (leer = läuft)' : 'Ende', end)),
  ], {
    onSave: () => {
      if (!start.value) throw new Error('Bitte einen Start angeben.');
      if (!end.value && !canRun) throw new Error('Bitte ein Ende angeben.');
      store.dispatch({
        type: 'saveEntry',
        entry: { ...entry, areaId: area.value, start: fromLocalInput(start.value), end: end.value ? fromLocalInput(end.value) : null },
      });
    },
    onDelete: !isNew && (() => store.dispatch({ type: 'deleteEntry', id: entry.id })),
  });
}

export const editEntry = (store, entry) => entrySheet(store, entry, false);

export function newEntry(store, dayStart) {
  const start = Math.min(dayStart + 12 * HOUR, Date.now() - HOUR);
  const areaId = store.state.areas.find((a) => !a.archived)?.id;
  entrySheet(store, { id: crypto.randomUUID(), areaId, start, end: start + HOUR }, true);
}
