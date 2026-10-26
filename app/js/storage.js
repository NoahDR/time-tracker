import { SCHEMA_VERSION, initialState } from './domain.js';

const STORAGE_KEY = 'time-tracker/state';
export const EXPORT_FORMAT = 'time-tracker-export';

export function load(storage = localStorage) {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return initialState();
  try {
    return parseState(JSON.parse(raw));
  } catch {
    storage.setItem(`${STORAGE_KEY}/unreadable-${Date.now()}`, raw);
    return initialState();
  }
}

export function save(state, storage = localStorage) {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const iso = (ms) => (ms === null ? null : new Date(ms).toISOString());

export function toExport(state, now) {
  const byId = new Map(state.categories.map((c) => [c.id, c]));
  return {
    format: EXPORT_FORMAT,
    version: SCHEMA_VERSION,
    exportedAt: iso(now),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    description:
      'Zeiterfassung pro Lebensbereich. entries: start/end als ISO-8601 (UTC), end=null bedeutet laufend. ' +
      'durationMinutes ist zum Exportzeitpunkt berechnet. categories.group ordnet Bereiche (z. B. Rule of Life).',
    categories: state.categories,
    entries: state.entries.map((e) => ({
      id: e.id,
      categoryId: e.categoryId,
      category: byId.get(e.categoryId)?.name ?? null,
      group: byId.get(e.categoryId)?.group ?? null,
      start: iso(e.start),
      end: iso(e.end),
      durationMinutes: Math.round(((e.end ?? now) - e.start) / 60_000),
    })),
  };
}

const fail = (message) => {
  throw new Error(`Ungültige Daten: ${message}`);
};

const toMs = (value) => {
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : fail(`Zeitpunkt "${value}"`);
};

const str = (value, field) => (typeof value === 'string' && value ? value : fail(`Feld "${field}"`));

export function parseState(data) {
  if (!data || typeof data !== 'object') fail('kein Objekt');
  if (data.format !== undefined && data.format !== EXPORT_FORMAT) fail('unbekanntes Format');
  if (data.version !== SCHEMA_VERSION) fail(`Version ${data.version}`);
  if (!Array.isArray(data.categories) || !Array.isArray(data.entries)) fail('categories/entries fehlen');

  const categories = data.categories.map((c) => ({
    id: str(c.id, 'category.id'),
    name: str(c.name, 'category.name'),
    group: str(c.group, 'category.group'),
    icon: typeof c.icon === 'string' ? c.icon : '•',
    color: typeof c.color === 'string' ? c.color : '#888888',
    archived: Boolean(c.archived),
  }));
  const ids = new Set(categories.map((c) => c.id));

  const entries = data.entries.map((e) => {
    const entry = {
      id: str(e.id, 'entry.id'),
      categoryId: str(e.categoryId, 'entry.categoryId'),
      start: toMs(e.start),
      end: e.end === null ? null : toMs(e.end),
    };
    if (!ids.has(entry.categoryId)) fail(`unbekannter Bereich "${entry.categoryId}"`);
    if (entry.end !== null && entry.end < entry.start) fail(`Eintrag ${entry.id} endet vor dem Start`);
    return entry;
  });
  if (entries.filter((e) => e.end === null).length > 1) fail('mehrere laufende Einträge');

  return { version: SCHEMA_VERSION, categories, entries: entries.sort((a, b) => a.start - b.start) };
}
