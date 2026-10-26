@AGENTS.md

## pstack

pstack is vendored into `.claude/` as project skills and agents (see `.claude/pstack/VENDORED.md`). Its skills are written for Cursor; read `.claude/docs/harness/claude-code.md` once per session for the name mapping, with these overrides because pstack is not installed as a plugin here:

- `<pstack>` is `.claude/`. pstack's own `README.md` is at `.claude/pstack/README.md`.
- Commands and agents have no `pstack:` prefix: `/poteto-mode`, not `/pstack:poteto-mode`; `subagent_type: "poteto-agent"`, not `pstack:poteto-agent`.
- When spawning `poteto-agent`, pass the absolute path of `.claude/skills/poteto-mode/SKILL.md` in the brief. It is not under `~/.claude/plugins/`.
