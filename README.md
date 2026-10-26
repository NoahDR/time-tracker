# Rhythmus

Rhythmus ist eine Web-App zur Zeiterfassung fürs iPhone. Du tippst auf einen Lebensbereich, und die Zeit läuft. Ein Tipp auf einen anderen Bereich wechselt nahtlos. Am Ende steht ein ehrliches Bild deines Lebensrhythmus, inklusive der Praktiken der Rule of Life.

## Auf dem iPhone installieren

1. Die veröffentlichte Seite (GitHub Pages, siehe unten) in **Safari** öffnen.
2. Auf **Teilen** tippen und **Zum Home-Bildschirm** wählen.
3. Die App startet dann im Vollbild und funktioniert offline.

Die Daten liegen nur auf dem Gerät (`localStorage`) und verlassen es nie. Unter **Einstellungen → Exportieren** gibt es eine vollständige JSON-Datei. Sie dient als Backup und als Grundlage für eine Auswertung mit Claude. **Importieren** stellt ein Backup wieder her.

## Funktionen

- **Heute.** Zeigt den laufenden Timer mit Stopp-Taste, Kacheln pro Bereich mit der heutigen Summe, einen 24-Stunden-Verlauf und alle Einträge. Einträge lassen sich bearbeiten, löschen oder nachtragen.
- **Auswertung.** Wahlweise für Woche, Monat oder Jahr. Sie zeigt die erfasste Zeit, den Durchschnitt pro Tag, die nicht erfasste Zeit, die Anteile je Gruppe und die Balken je Bereich.
- **Einstellungen.** Bereiche anlegen, umbenennen, einfärben und archivieren. Dazu kommen Export, Kopieren in die Zwischenablage und Import.

Die Startbereiche sind Basis (Schlafen, Arbeit, Essen), Privates (Orga, Familytime, Me Time), Gemeinde (Leitung, Jugend) und Rule of Life (Gebet, Bibel, Stille, Sabbat, Gemeinschaft).

## Entwicklung

Die App besteht aus reinem HTML, CSS und JavaScript-Modulen in `app/`, ohne Build-Schritt und ohne Abhängigkeiten.

```bash
npm test                               # Unit-Tests (node --test)
python3 -m http.server -d app 8000     # lokal unter http://localhost:8000
```

| Datei | Verantwortung |
| --- | --- |
| `app/js/domain.js` | Datenmodell und Reducer. Höchstens ein Eintrag läuft gleichzeitig. |
| `app/js/time.js` | Zeiträume (Tag, Woche, Monat, Jahr) und Formatierung |
| `app/js/stats.js` | Einträge auf Zeiträume zuschneiden und summieren |
| `app/js/storage.js` | Persistenz sowie Export- und Importformat mit Validierung |
| `app/js/ui/*.js` | Ansichten und Bearbeitungs-Sheets |
| `app/sw.js` | Offline-Cache. Ein Test prüft, dass jede App-Datei darin steht. |

## Veröffentlichen

`.github/workflows/pages.yml` testet jeden Push und jeden PR. Ein Push auf `main` veröffentlicht `app/` auf GitHub Pages. Einmalig ist dafür nötig: **Settings → Pages → Source: GitHub Actions**. Für private Repositories setzt GitHub Pages einen kostenpflichtigen Plan voraus (GitHub Pro).
