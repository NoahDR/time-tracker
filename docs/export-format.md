# Export format

**Einstellungen → Exportieren** (oder **Kopieren**) liefert eine JSON-Datei, die alle Daten der App enthält. **Importieren** liest dieselbe Datei wieder ein und ersetzt dabei die vorhandenen Daten. Implementiert ist das in `app/js/storage.js` (`toExport`, `parseState`).

```json
{
  "format": "time-tracker-export",
  "version": 1,
  "exportedAt": "2026-12-31T20:15:00.000Z",
  "timeZone": "Europe/Berlin",
  "description": "…",
  "categories": [
    { "id": "prayer", "name": "Gebet", "group": "Rule of Life", "icon": "🙏", "color": "#A78BDA", "archived": false }
  ],
  "entries": [
    {
      "id": "b1fe516b-…",
      "categoryId": "prayer",
      "category": "Gebet",
      "group": "Rule of Life",
      "start": "2026-10-27T05:30:00.000Z",
      "end": "2026-10-27T05:50:00.000Z",
      "durationMinutes": 20
    }
  ]
}
```

| Feld | Bedeutung |
| --- | --- |
| `version` | Schema-Version. Ändert sich das Format, steigt sie, und ältere Versionen werden beim Import migriert. |
| `timeZone` | IANA-Zeitzone des Geräts beim Export. Alle Zeitpunkte sind UTC. Für Tagesgrenzen und Uhrzeiten rechnest du sie in diese Zone um. |
| `categories[].group` | Gruppe des Bereichs: `Basis`, `Privates`, `Gemeinde`, `Rule of Life` oder eine eigene. |
| `categories[].archived` | Ausgeblendeter Bereich. Seine Einträge bleiben erhalten. |
| `entries[].end` | `null` bedeutet, dass der Eintrag beim Export noch lief. |
| `entries[].durationMinutes` | Dauer zum Exportzeitpunkt. Bei laufenden Einträgen ist sie bis `exportedAt` gerechnet. |
| `entries[].category`, `group` | Lesbare Kopien aus `categories`, damit die Datei für sich verständlich ist. Beim Import werden sie ignoriert. |

Nicht erfasste Zeit steht nicht in der Datei. Sie ergibt sich als Lücke zwischen den Einträgen.
