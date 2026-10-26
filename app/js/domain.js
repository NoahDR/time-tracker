export const SCHEMA_VERSION = 2;

export const PALETTE = [
  '#8B7CF6', '#5B9CF6', '#3CC6D9', '#3DD68C', '#A3D94A',
  '#F5C542', '#F59E42', '#F26B6B', '#EC6FB0', '#9AA4B8',
];

export const initialState = () => ({ version: SCHEMA_VERSION, groups: [], areas: [], entries: [] });

export const nextColor = (items) =>
  PALETTE.find((c) => !items.some((i) => i.color === c)) ?? PALETTE[items.length % PALETTE.length];

export const runningEntry = (state) => state.entries.find((e) => e.end === null) ?? null;

export const areaById = (state, id) => state.areas.find((a) => a.id === id) ?? null;

export const groupById = (state, id) => state.groups.find((g) => g.id === id) ?? null;

export const areasOf = (state, groupId, { archived = false } = {}) =>
  state.areas.filter((a) => a.groupId === groupId && (archived || !a.archived));

const closeRunning = (entries, at) =>
  entries.map((e) => (e.end === null ? { ...e, end: Math.max(at, e.start) } : e));

const upsert = (items, item) =>
  items.some((i) => i.id === item.id) ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item];

const requireName = (name) => {
  if (!name.trim()) throw new Error('Bitte einen Namen angeben.');
};

function moveWithin(items, id, delta, sameBucket) {
  const index = items.findIndex((i) => i.id === id);
  const peers = items.map((item, i) => ({ item, i })).filter(({ item }) => sameBucket(item, items[index]));
  const position = peers.findIndex(({ i }) => i === index);
  const target = peers[position + delta];
  if (!target) return items;
  const result = [...items];
  [result[index], result[target.i]] = [result[target.i], result[index]];
  return result;
}

const handlers = {
  start(state, { areaId, at }) {
    if (runningEntry(state)?.areaId === areaId) return state;
    const entries = closeRunning(state.entries, at);
    return { ...state, entries: [...entries, { id: crypto.randomUUID(), areaId, start: at, end: null }] };
  },

  stop(state, { at }) {
    return runningEntry(state) ? { ...state, entries: closeRunning(state.entries, at) } : state;
  },

  saveEntry(state, { entry }) {
    if (entry.end !== null && entry.end <= entry.start) throw new Error('Das Ende muss nach dem Start liegen.');
    const others = state.entries.filter((e) => e.id !== entry.id);
    if (entry.end === null && others.some((e) => e.end === null)) {
      throw new Error('Es kann nur ein Eintrag gleichzeitig laufen.');
    }
    return { ...state, entries: [...others, entry].sort((a, b) => a.start - b.start) };
  },

  deleteEntry(state, { id }) {
    return { ...state, entries: state.entries.filter((e) => e.id !== id) };
  },

  saveGroup(state, { group }) {
    requireName(group.name);
    return { ...state, groups: upsert(state.groups, { ...group, name: group.name.trim() }) };
  },

  deleteGroup(state, { id }) {
    if (state.areas.some((a) => a.groupId === id)) throw new Error('Die Gruppe enthält noch Bereiche.');
    return { ...state, groups: state.groups.filter((g) => g.id !== id) };
  },

  saveArea(state, { area }) {
    requireName(area.name);
    if (!groupById(state, area.groupId)) throw new Error('Bitte eine Gruppe wählen.');
    return { ...state, areas: upsert(state.areas, { ...area, name: area.name.trim() }) };
  },

  deleteArea(state, { id }) {
    if (state.entries.some((e) => e.areaId === id)) throw new Error('Der Bereich hat Einträge. Archiviere ihn stattdessen.');
    return { ...state, areas: state.areas.filter((a) => a.id !== id) };
  },

  moveGroup(state, { id, delta }) {
    return { ...state, groups: moveWithin(state.groups, id, delta, () => true) };
  },

  moveArea(state, { id, delta }) {
    return { ...state, areas: moveWithin(state.areas, id, delta, (a, b) => a.groupId === b.groupId) };
  },

  replace(_state, { state }) {
    return state;
  },

  reset() {
    return initialState();
  },
};

export function reduce(state, action) {
  const handler = handlers[action.type];
  if (!handler) throw new Error(`Unknown action: ${action.type}`);
  return handler(state, action);
}
