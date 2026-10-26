# time-tracker

Private repository. "Rhythmus" is an iPhone time-tracking PWA: plain HTML/CSS/ES modules in `app/`, no build step, no dependencies, deployed to GitHub Pages by `.github/workflows/pages.yml`. See `README.md` for the module map.

- `npm test` runs the unit tests (`node --test`). Keep domain logic pure and covered there.
- State changes go through the reducer in `app/js/domain.js`. The export format in `app/js/storage.js` is a public contract: bump `SCHEMA_VERSION` and migrate in `parseState` when it changes.
- A new file under `app/` must be added to `SHELL` in `app/sw.js`; a test enforces it.

## Conventions

- Clean, maintainable, well-structured code comes first.
- Primary language is C#. C++ and VB.NET may appear.
- Follow `.editorconfig` for formatting and naming.

## pstack

pstack is vendored into `.claude/` as project skills and agents (see `.claude/pstack/VENDORED.md`). Its skills are written for Cursor; read `.claude/docs/harness/claude-code.md` once per session for the name mapping, with these overrides because pstack is not installed as a plugin here:

- `<pstack>` is `.claude/`. pstack's own `README.md` is at `.claude/pstack/README.md`.
- Commands and agents have no `pstack:` prefix: `/poteto-mode`, not `/pstack:poteto-mode`; `subagent_type: "poteto-agent"`, not `pstack:poteto-agent`.
- When spawning `poteto-agent`, pass the absolute path of `.claude/skills/poteto-mode/SKILL.md` in the brief. It is not under `~/.claude/plugins/`.
