import { areasOf, nextColor } from '../domain.js';
import { h } from '../dom.js';
import { quickAdd } from './controls.js';
import { icon } from './icons.js';
import { editArea, editGroup } from './sheets.js';

const SUGGESTED_GROUPS = ['Allgemein', 'Privat', 'Arbeit', 'Gemeinde', 'Glaube', 'Gesundheit'];

const addGroup = (store, name) =>
  store.dispatch({ type: 'saveGroup', group: { id: crypto.randomUUID(), name, color: nextColor(store.state.groups) } });

const addArea = (store, group, name) =>
  store.dispatch({
    type: 'saveArea',
    area: { id: crypto.randomUUID(), name, groupId: group.id, color: group.color, icon: '', archived: false },
  });

const countLabel = (n) => (n === 1 ? '1 Bereich' : `${n} Bereiche`);

export function structureEditor(store, { suggestions = false } = {}) {
  const used = new Set(store.state.groups.map((g) => g.name.toLowerCase()));
  const open = SUGGESTED_GROUPS.filter((name) => !used.has(name.toLowerCase()));

  return h('div', { className: 'structure' },
    store.state.groups.map((group) => {
      const areas = areasOf(store.state, group.id, { archived: true });
      return h('section', { className: 'struct-group', 'data-key': group.id, style: { '--c': group.color } },
        h('button', { className: 'struct-head', onClick: () => editGroup(store, group) },
          h('span', { className: 'dot' }),
          h('span', { className: 'struct-name' }, group.name),
          h('span', { className: 'struct-count' }, countLabel(areas.length)),
          icon('right', 18)),
        h('div', { className: 'struct-areas' },
          areas.map((area) => h('button', {
            className: `struct-area${area.archived ? ' archived' : ''}`, 'data-key': area.id,
            style: { '--c': area.color }, onClick: () => editArea(store, area),
          },
          h('span', { className: 'dot' }),
          area.icon && h('span', { className: 'struct-icon' }, area.icon),
          h('span', null, area.name),
          area.archived && h('span', { className: 'struct-tag' }, 'archiviert'))),
          quickAdd(`add-${group.id}`, `Bereich in ${group.name} …`, (name) => addArea(store, group, name))));
    }),
    quickAdd('add-group', store.state.groups.length ? 'Weitere Gruppe …' : 'Erste Gruppe …', (name) => addGroup(store, name)),
    suggestions && open.length > 0 && h('div', { className: 'suggestions', 'data-key': 'suggestions' },
      h('span', { className: 'suggestions-label' }, 'Vorschläge'),
      open.map((name) => h('button', { className: 'suggestion', 'data-key': name, onClick: () => addGroup(store, name) },
        icon('plus', 14), name))));
}
