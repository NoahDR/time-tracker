import { PALETTE, SCHEMA_VERSION, initialState } from './domain.js';

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
  const areaOf = new Map(state.areas.map((a) => [a.id, a]));
  const groupOf = new Map(state.groups.map((g) => [g.id, g]));
  return {
    format: EXPORT_FORMAT,
    version: SCHEMA_VERSION,
    exportedAt: iso(now),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    description:
      'Zeiterfassung pro Bereich. Bereiche (areas) gehören zu Gruppen (groups). entries: start/end als ISO-8601 (UTC), ' +
      'end=null bedeutet laufend. durationMinutes ist zum Exportzeitpunkt berechnet.',
    groups: state.groups,
    areas: state.areas,
    entries: state.entries.map((e) => {
      const area = areaOf.get(e.areaId);
      return {
        id: e.id,
        areaId: e.areaId,
        area: area?.name ?? null,
        group: groupOf.get(area?.groupId)?.name ?? null,
        start: iso(e.start),
        end: iso(e.end),
        durationMinutes: Math.round(((e.end ?? now) - e.start) / 60_000),
      };
    }),
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

const color = (value) => (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : PALETTE[0]);

function migrateV1(data) {
  if (!Array.isArray(data.categories)) fail('categories fehlen');
  const names = [...new Set(data.categories.map((c) => str(c.group, 'category.group')))];
  const groups = names.map((name, i) => ({
    id: `group-${i + 1}`,
    name,
    color: data.categories.find((c) => c.group === name)?.color,
  }));
  const groupId = new Map(groups.map((g) => [g.name, g.id]));
  return {
    groups,
    areas: data.categories.map((c) => ({ ...c, groupId: groupId.get(c.group) })),
    entries: (data.entries ?? []).map((e) => ({ ...e, areaId: e.categoryId })),
  };
}

export function parseState(data) {
  if (!data || typeof data !== 'object') fail('kein Objekt');
  if (data.format !== undefined && data.format !== EXPORT_FORMAT) fail('unbekanntes Format');
  if (data.version === 1) data = migrateV1(data);
  else if (data.version !== SCHEMA_VERSION) fail(`Version ${data.version}`);
  if (![data.groups, data.areas, data.entries].every(Array.isArray)) fail('groups/areas/entries fehlen');

  const groups = data.groups.map((g) => ({ id: str(g.id, 'group.id'), name: str(g.name, 'group.name'), color: color(g.color) }));
  const groupIds = new Set(groups.map((g) => g.id));

  const areas = data.areas.map((a) => {
    const area = {
      id: str(a.id, 'area.id'),
      name: str(a.name, 'area.name'),
      groupId: str(a.groupId, 'area.groupId'),
      color: color(a.color),
      icon: typeof a.icon === 'string' ? a.icon : '',
      archived: Boolean(a.archived),
    };
    if (!groupIds.has(area.groupId)) fail(`unbekannte Gruppe "${area.groupId}"`);
    return area;
  });
  const areaIds = new Set(areas.map((a) => a.id));

  const entries = data.entries.map((e) => {
    const entry = {
      id: str(e.id, 'entry.id'),
      areaId: str(e.areaId, 'entry.areaId'),
      start: toMs(e.start),
      end: e.end === null ? null : toMs(e.end),
    };
    if (!areaIds.has(entry.areaId)) fail(`unbekannter Bereich "${entry.areaId}"`);
    if (entry.end !== null && entry.end < entry.start) fail(`Eintrag ${entry.id} endet vor dem Start`);
    return entry;
  });
  if (entries.filter((e) => e.end === null).length > 1) fail('mehrere laufende Einträge');

  return { version: SCHEMA_VERSION, groups, areas, entries: entries.sort((a, b) => a.start - b.start) };
}
