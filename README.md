# Rhythmus

[![Test and deploy](https://github.com/NoahDR/time-tracker/actions/workflows/pages.yml/badge.svg)](https://github.com/NoahDR/time-tracker/actions/workflows/pages.yml)

Rhythmus ist eine Zeiterfassung fürs iPhone. Du tippst auf einen Lebensbereich, und die Zeit läuft. Ein Tipp auf einen anderen Bereich wechselt nahtlos. Am Ende steht ein ehrliches Bild deines Lebensrhythmus, inklusive der Praktiken einer Rule of Life.

**App öffnen:** https://noahdr.github.io/time-tracker/

## Auf dem iPhone installieren

1. Die App-Adresse in **Safari** öffnen.
2. Auf **Teilen** tippen und **Zum Home-Bildschirm** wählen.
3. Rhythmus startet dann im Vollbild und funktioniert offline. Updates kommen automatisch beim nächsten Öffnen mit Netz.

## Funktionen

- **Heute.** Zeigt den laufenden Timer mit Stopp-Taste und die Kacheln mit der heutigen Summe pro Bereich. Darunter folgen ein 24-Stunden-Verlauf und alle Einträge, die du bearbeiten, löschen oder nachtragen kannst.
- **Auswertung.** Für Woche, Monat und Jahr. Sie zeigt die erfasste Zeit, den Schnitt pro Tag, die nicht erfasste Zeit, die Anteile je Gruppe und einen Balken je Bereich.
- **Einstellungen.** Hier legst du Bereiche an, benennst sie um, färbst sie ein und archivierst sie. Export und Import sind auch hier.

Die Startbereiche sind in vier Gruppen sortiert:
- Basis: Schlafen, Arbeit, Essen
- Privates: Orga, Familytime, Me Time
- Gemeinde: Leitung, Jugend
- Rule of Life: Gebet, Bibel, Stille, Sabbat, Gemeinschaft

## Datenschutz

Alle Daten bleiben auf deinem Gerät, im `localStorage` des Browsers. Es gibt keinen Server, kein Konto, kein Tracking und keine Anfragen an fremde Dienste. Eine Content Security Policy erzwingt das. Exportiere regelmäßig als Backup, denn wenn du die App vom Home-Bildschirm löschst, löscht iOS auch ihre Daten.

## Auswertung mit Claude

Die Datei aus **Einstellungen → Exportieren** enthält alle Einträge. Das Format beschreibt [docs/export-format.md](docs/export-format.md). Mit dem Prompt in [docs/analysis-prompt.md](docs/analysis-prompt.md) erstellt Claude daraus eine Jahresanalyse. Sie beantwortet auch die Frage, ob ein berufsbegleitender Master in Theologie realistisch in deinen Rhythmus passt.

## Entwicklung

Die App besteht aus reinem HTML, CSS und JavaScript-Modulen in `app/`. Es gibt keinen Build-Schritt und keine Laufzeit-Abhängigkeiten.

```bash
npm test            # Unit-Tests
npm ci && npm run e2e   # echte App im emulierten iPhone (Playwright)
npm run serve       # lokal unter http://localhost:8000
```

Architektur, Invarianten und Konventionen stehen in [AGENTS.md](AGENTS.md). Diese Datei ist der Einstieg für Menschen und KI-Agenten. Jeder Push auf `main` geht über einen Pull Request mit grüner CI und wird danach automatisch veröffentlicht.

## Lizenz

[MIT](LICENSE). Der Ordner `.claude/` enthält [pstack](https://github.com/cursor/plugins/tree/main/pstack) von Lauren Tan, ebenfalls unter MIT ([Lizenz](.claude/pstack/LICENSE)).
