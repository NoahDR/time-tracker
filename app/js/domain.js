export const SCHEMA_VERSION = 1;

const DEFAULT_CATEGORIES = [
  ['sleep', 'Schlafen', 'Basis', '😴', '#6C7BD9'],
  ['work', 'Arbeit', 'Basis', '💼', '#4A90D9'],
  ['food', 'Essen', 'Basis', '🍽️', '#E8A33D'],
  ['orga', 'Orga', 'Privates', '🗂️', '#8E9AAF'],
  ['family', 'Familytime', 'Privates', '👨‍👩‍👧', '#E46C8C'],
  ['me', 'Me Time', 'Privates', '☕', '#C98B5B'],
  ['lead', 'Leitung', 'Gemeinde', '🧭', '#3FB68B'],
  ['youth', 'Jugend', 'Gemeinde', '🔥', '#F07A4A'],
  ['prayer', 'Gebet', 'Rule of Life', '🙏', '#A78BDA'],
  ['scripture', 'Bibel', 'Rule of Life', '📖', '#7E6BC4'],
  ['solitude', 'Stille', 'Rule of Life', '🌿', '#5DAA9E'],
  ['sabbath', 'Sabbat', 'Rule of Life', '🕯️', '#D9B25C'],
  ['community', 'Gemeinschaft', 'Rule of Life', '🤝', '#D9826C'],
];

export function initialState() {
  return {
    version: SCHEMA_VERSION,
    categories: DEFAULT_CATEGORIES.map(([id, name, group, icon, color]) => ({
      id, name, group, icon, color, archived: false,
    })),
    entries: [],
  };
}

export const runningEntry = (state) => state.entries.find((e) => e.end === null) ?? null;

export const categoryById = (state, id) => state.categories.find((c) => c.id === id) ?? null;

export function groupedCategories(categories) {
  const groups = new Map();
  for (const c of categories) {
    if (!groups.has(c.group)) groups.set(c.group, []);
    groups.get(c.group).push(c);
  }
  return groups;
}

const closeRunning = (entries, at) =>
  entries.map((e) => (e.end === null ? { ...e, end: Math.max(at, e.start) } : e));

const handlers = {
  start(state, { categoryId, at }) {
    if (runningEntry(state)?.categoryId === categoryId) return state;
    const entries = closeRunning(state.entries, at);
    return { ...state, entries: [...entries, { id: crypto.randomUUID(), categoryId, start: at, end: null }] };
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
    const entries = [...others, entry].sort((a, b) => a.start - b.start);
    return { ...state, entries };
  },

  deleteEntry(state, { id }) {
    return { ...state, entries: state.entries.filter((e) => e.id !== id) };
  },

  saveCategory(state, { category }) {
    const exists = state.categories.some((c) => c.id === category.id);
    const categories = exists
      ? state.categories.map((c) => (c.id === category.id ? category : c))
      : [...state.categories, category];
    return { ...state, categories };
  },

  replace(_state, { state }) {
    return state;
  },
};

export function reduce(state, action) {
  const handler = handlers[action.type];
  if (!handler) throw new Error(`Unknown action: ${action.type}`);
  return handler(state, action);
}
