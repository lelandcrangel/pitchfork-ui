---
name: conventional-commits-commit-messages
description: All git commits for pitchfork-ui must use Conventional Commits format
metadata:
  type: feedback
---

Always use Conventional Commits format for all git commit messages in this repo.

```
<type>(<optional scope>): <description>
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`, `build`, `ci`
**Scope:** optional — use PascalCase component name for component-specific changes (e.g. `(Button)`, `(Calendar)`), omit for workspace-wide changes.

**Why:** release-please reads commit messages to determine version bumps and generate the changelog. `feat:` → minor bump, `fix:` → patch bump, `refactor:`/`docs:`/etc. → no bump.

**How to apply:** Any time a git commit is created in this repo, write the message in this format.
