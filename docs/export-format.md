# Export format

**Einstellungen → Exportieren** (oder **Kopieren**) liefert eine JSON-Datei, die alle Daten der App enthält. **Importieren** liest dieselbe Datei wieder ein und ersetzt dabei die vorhandenen Daten. Implementiert ist das in `app/js/storage.js` (`toExport`, `parseState`).

```json
{
  "format": "time-tracker-export",
  "version": 2,
  "exportedAt": "2026-12-31T20:15:00.000Z",
  "timeZone": "Europe/Berlin",
  "description": "…",
  "groups": [
    { "id": "8f1c…", "name": "Glaube", "color": "#8B7CF6" }
  ],
  "areas": [
    { "id": "2b7e…", "name": "Gebet", "groupId": "8f1c…", "color": "#8B7CF6", "icon": "🙏", "archived": false }
  ],
  "entries": [
    {
      "id": "b1fe516b-…",
      "areaId": "2b7e…",
      "area": "Gebet",
      "group": "Glaube",
      "start": "2026-10-27T05:30:00.000Z",
      "end": "2026-10-27T05:50:00.000Z",
      "durationMinutes": 20
    }
  ]
}
```

| Feld | Bedeutung |
| --- | --- |
| `version` | Schema-Version. Version-1-Backups (feste `categories` mit Gruppennamen) werden beim Import automatisch nach Version 2 migriert. |
| `timeZone` | IANA-Zeitzone des Geräts beim Export. Alle Zeitpunkte sind UTC. Für Tagesgrenzen und Uhrzeiten rechnest du sie in diese Zone um. |
| `groups` | Selbst angelegte Gruppen in der Reihenfolge der App, zum Beispiel `Privat` oder `Arbeit`. |
| `areas` | Trackbare Bereiche. Jeder gehört über `groupId` zu genau einer Gruppe. `archived` heißt ausgeblendet, die Einträge bleiben erhalten. |
| `entries[].end` | `null` bedeutet, dass der Eintrag beim Export noch lief. |
| `entries[].durationMinutes` | Dauer zum Exportzeitpunkt. Bei laufenden Einträgen ist sie bis `exportedAt` gerechnet. |
| `entries[].area`, `group` | Lesbare Kopien der Namen, damit die Datei für sich verständlich ist. Beim Import werden sie ignoriert. |

Nicht erfasste Zeit steht nicht in der Datei. Sie ergibt sich als Lücke zwischen den Einträgen.
