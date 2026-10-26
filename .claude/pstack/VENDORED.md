# Vendored pstack

pstack is vendored into this repository as project skills and agents, not installed as a plugin.

| | |
| --- | --- |
| Upstream | https://github.com/cursor/plugins (`harness/pstack/claude-code`) |
| Version | 0.15.32 |
| Commit | `9e88dad267e8991d26a6debc0db0d943d437104b` (2026-10-26) |
| License | MIT, see [LICENSE](./LICENSE) |

## Layout

The upstream Claude Code tree is split across `.claude/` so Claude Code discovers it without a plugin install:

| Upstream | Here |
| --- | --- |
| `skills/` | `.claude/skills/` |
| `agents/` | `.claude/agents/` |
| `docs/` | `.claude/docs/` |
| `README.md`, `LICENSE`, `plugin.json` | `.claude/pstack/` |

Do not edit the vendored files by hand. Repo-specific adjustments belong in `CLAUDE.md`, so an update stays a plain copy.

## Update

```bash
git clone --depth 1 https://github.com/cursor/plugins.git /tmp/cursor-plugins
SRC=/tmp/cursor-plugins/harness/pstack/claude-code
rm -rf .claude/skills .claude/agents .claude/docs
cp -a "$SRC/skills" "$SRC/agents" "$SRC/docs" .claude/
cp -a "$SRC/README.md" "$SRC/LICENSE" "$SRC/plugin.json" .claude/pstack/
```

Then update the version and commit in the table above.
