import { groupedCategories } from '../domain.js';
import { h } from '../dom.js';
import { parseState, toExport } from '../storage.js';
import { editCategory } from './sheets.js';

const exportFileName = (now) => `time-tracker-${new Date(now).toISOString().slice(0, 10)}.json`;

const exportJson = (store) => JSON.stringify(toExport(store.state, Date.now()), null, 2);

async function shareExport(store) {
  const file = new File([exportJson(store)], exportFileName(Date.now()), { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Zeiterfassung' });
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
    const message = `${state.entries.length} Einträge importieren? Die aktuellen Daten werden ersetzt.`;
    if (!confirm(message)) return;
    store.dispatch({ type: 'replace', state });
    store.toast('Import abgeschlossen.');
  } catch (error) {
    store.toast(error.message);
  }
}

export function settingsView(store) {
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', hidden: true,
    onChange: (e) => e.target.files[0] && importFile(store, e.target.files[0]),
  });

  return [
    h('header', { className: 'title' }, h('h1', null, 'Einstellungen')),
    [...groupedCategories(store.state.categories)].map(([group, categories]) =>
      h('section', { className: 'card' },
        h('h2', null, group),
        h('ul', { className: 'list' }, categories.map((c) =>
          h('li', { className: c.archived ? 'archived' : '', onClick: () => editCategory(store, c) },
            h('span', { className: 'dot', style: { background: c.color } }),
            h('span', null, `${c.icon} ${c.name}`),
            h('span', { className: 'muted' }, c.archived ? 'archiviert' : '›')))))),
    h('button', { className: 'link-btn', onClick: () => editCategory(store, null) }, '+ Neuer Bereich'),
    h('section', { className: 'card' },
      h('h2', null, 'Daten'),
      h('p', { className: 'muted' },
        `${store.state.entries.length} Einträge, nur auf diesem Gerät gespeichert. Exportiere regelmäßig als Backup.`),
      h('div', { className: 'actions' },
        h('button', { className: 'btn primary', onClick: () => shareExport(store) }, 'Exportieren'),
        h('button', { className: 'btn', onClick: () => copyExport(store) }, 'Kopieren'),
        h('button', { className: 'btn', onClick: () => fileInput.click() }, 'Importieren')),
      fileInput),
    h('section', { className: 'card' },
      h('h2', null, 'Auf dem iPhone installieren'),
      h('p', { className: 'muted' },
        'In Safari öffnen, auf „Teilen“ tippen und „Zum Home-Bildschirm“ wählen. Die App läuft dann im Vollbild und offline.')),
  ];
}
