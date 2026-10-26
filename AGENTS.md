# AGENTS.md

Guide for AI coding agents and human contributors. `CLAUDE.md` imports this file.

## Project

Rhythmus is an offline time-tracking PWA for iPhone. Plain HTML, CSS and ES modules in `app/`, no build step and no runtime dependencies. GitHub Pages serves `app/` at https://noahdr.github.io/time-tracker/. The UI is German. Code, identifiers and commit messages are English.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Unit tests with `node --test`. Fast, no install needed. |
| `npm ci && npm run e2e` | Drives the real app in an emulated iPhone with Playwright. |
| `npm run serve` | Serves `app/` at http://localhost:8000. |

Run both test commands before you open a PR. CI runs them too.

## Architecture

| Path | Owns |
| --- | --- |
| `app/js/domain.js` | State shape (`groups`, `areas`, `entries`), the color palette, and the reducer. Every state change is an action through `reduce`. A fresh install starts empty; the user builds the structure in onboarding. |
| `app/js/time.js` | Day, week (Monday start), month and year ranges, and all formatting. |
| `app/js/stats.js` | Clipping entries to a range, summing by area and group, and chart buckets. Pure functions. |
| `app/js/storage.js` | `localStorage` persistence and the export/import format, validated in `parseState`. |
| `app/js/ui/` | One module per view (`onboarding`, `today`, `overview`, `settings`), the shared `structure` editor, `sheets`, `charts`, `controls` and `icons`. |
| `app/js/dom.js` | `h()`/`s()` element helpers and `patch()`, which morphs the live DOM so elements survive re-renders and CSS transitions run. Give list items a `data-key`. Text goes in as text nodes, never as HTML. |
| `app/sw.js` | Network-first service worker with an offline cache of the app shell. |
| `docs/` | Export format and the year-end analysis prompt. |

## Invariants

- At most one entry runs at a time (`end: null`). The reducer enforces it.
- A running timer stores only its start time. Never add background timers that write state.
- The export format is a contract with existing backups. Changing it means bumping `SCHEMA_VERSION`, migrating old versions in `parseState`, and updating `docs/export-format.md`.
- Every file under `app/` must be listed in `SHELL` in `app/sw.js`. `tests/offline-shell.test.js` enforces this.
- The app makes no network requests to other hosts. The Content Security Policy in `app/index.html` blocks them, so keep it strict and add no CDNs or analytics.
- Tracking data never enters the repository. Exports are personal data, and `.gitignore` excludes them.

## Conventions

- Clean, small modules organized by domain, not by phase. Prefer a lookup table or reducer action over a new branch in a conditional.
- Two-space indent, single quotes, semicolons, trailing commas in multiline literals. `.editorconfig` holds the whitespace rules.
- Comments only for a non-obvious *why*.
- Motion follows Emil Kowalski's rules: animate only `transform` and `opacity`, use the `--ease-*` tokens in `styles.css`, keep UI motion under 300 ms, and ship a `prefers-reduced-motion` variant. Inline styles must go through CSSOM (`style.setProperty`, `style.cssText`), never `setAttribute('style')`, or the CSP blocks them.
- Tests assert behavior a user can observe, not internals.

## Workflow

- `main` is protected. Every change lands through a pull request with a green `test` and `e2e` check. Force pushes and deletion are blocked.
- Workflow actions are pinned to full commit SHAs. Dependabot proposes updates monthly. Verify a bumped SHA against the upstream tag before merging.
- Report security issues privately, see `SECURITY.md`.
