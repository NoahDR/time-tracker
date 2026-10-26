import { h } from '../dom.js';
import { parseState, toExport } from '../storage.js';
import { sectionTitle } from './controls.js';
import { structureEditor } from './structure.js';

const HOLD_MS = 2000;

const exportFileName = (now) => `time-tracker-${new Date(now).toISOString().slice(0, 10)}.json`;

const exportJson = (store) => JSON.stringify(toExport(store.state, Date.now()), null, 2);

async function shareExport(store) {
  const file = new File([exportJson(store)], exportFileName(Date.now()), { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Rhythmus Export' });
    } catch (error) {
      if (error.name !== 'AbortError') store.toast(`Teilen fehlgeschlagen: ${error.message}`);
    }
    return;
  }
  const link = h('a', { href: URL.createObjectURL(file), download: file.name });
  link.click();
  URL.revokeObjectURL(link.href);
}

async function copyExport(store) {
  await navigator.clipboard.writeText(exportJson(store));
  store.toast('Export in die Zwischenablage kopiert.');
}

async function importFile(store, file) {
  try {
    const state = parseState(JSON.parse(await file.text()));
    if (!confirm(`${state.entries.length} Einträge importieren? Die aktuellen Daten werden ersetzt.`)) return;
    store.dispatch({ type: 'replace', state });
    store.setUi({ setup: state.areas.length === 0 });
    store.toast('Import abgeschlossen.');
  } catch (error) {
    store.toast(error.message);
  }
}

function holdButton(label, onConfirm) {
  let timer;
  const cancel = () => clearTimeout(timer);
  return h('button', {
    className: 'hold-btn',
    onPointerdown: () => { timer = setTimeout(onConfirm, HOLD_MS); },
    onPointerup: cancel,
    onPointerleave: cancel,
    onPointercancel: cancel,
    onContextmenu: (e) => e.preventDefault(),
  }, h('span', { className: 'hold-fill', 'aria-hidden': 'true' }), h('span', { className: 'hold-label' }, label));
}

export function settingsView(store) {
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onChange: (e) => e.target.files[0] && importFile(store, e.target.files[0]),
  });
  const { groups, areas, entries } = store.state;

  return [
    h('header', { className: 'page-head' }, h('p', { className: 'page-kicker' }, 'Rhythmus'), h('h1', null, 'Einstellungen')),
    sectionTitle('Struktur', 'Gruppen bündeln deine Bereiche. Tippe zum Bearbeiten, Farben und Reihenfolge inklusive.'),
    structureEditor(store),
    sectionTitle('Daten', `${groups.length} Gruppen · ${areas.length} Bereiche · ${entries.length} Einträge. Alles bleibt auf diesem Gerät.`),
    h('section', { className: 'card actions' },
      h('button', { className: 'btn primary', onClick: () => shareExport(store) }, 'Exportieren'),
      h('button', { className: 'btn', onClick: () => copyExport(store) }, 'Kopieren'),
      h('button', { className: 'btn', onClick: () => fileInput.click() }, 'Importieren'),
      fileInput),
    sectionTitle('Neu beginnen', 'Löscht alle Gruppen, Bereiche und Einträge. Exportiere vorher ein Backup.'),
    holdButton('Gedrückt halten zum Löschen', () => {
      store.dispatch({ type: 'reset' });
      store.setUi({ setup: true, view: 'today' });
      store.toast('Alle Daten gelöscht.');
    }),
    h('footer', { className: 'about' },
      h('p', null, 'Installieren: in Safari teilen und „Zum Home-Bildschirm“ wählen.'),
      h('p', null, 'Rhythmus · Daten bleiben auf deinem Gerät')),
  ];
}
