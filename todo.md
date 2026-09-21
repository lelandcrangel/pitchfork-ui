# Known gaps

Tracked here rather than in issues when the fix is small, well understood, and
does not need discussion. Referenced from `CLAUDE.md`.

---

## Markdown tables do not render in Storybook MDX

Storybook's MDX pipeline does not load `remark-gfm`, so a GFM table in an
`.mdx` file renders as a paragraph of pipe characters rather than a table. The
one table in the docs — the MCP tool list in `UsingWithAI.mdx` — hit this and
now uses the library's own `Table` component instead, which looks better
anyway. But the trap is still there for the next person who writes one.

**Fix:** add `remark-gfm` to the docs addon's
`mdxPluginOptions.mdxCompileOptions.remarkPlugins` in
`apps/docs/.storybook/main.ts`. Worth checking the other MDX pages afterwards,
since the same plugin also turns on strikethrough, footnotes and autolinks.

---

## Dark mode contrast failures

`node scripts/check-dark-contrast.mjs` reports 6 failing token pairs, including:

- `Warning border on warning bg` — `#b54708` on `#7a2e0e` → 1.74:1 (needs 3:1)
- `Danger border on danger bg` — `#d92d20` on `#7a271a` → 2.04:1 (needs 3:1)

These are pre-existing and predate the AI kit work. The script is **not wired
into CI**, so nothing stops further regressions.

**Fix:** correct the dark-mode token pairs in the `[data-theme='dark']` block of
`packages/react/src/styles/theme.css`, then add the checker to CI so the
accessibility claim in the package description stays true.

---

## The deploy has no retry around a transient FTP failure

`SamKirkland/FTP-Deploy-Action` exposes a `timeout` input but no retry — its
`action.yml` has 14 inputs and none of them mention retries or attempts. One
dropped connection fails the whole deploy.

This happened on `a73d61d`: the deploy failed after about 30 seconds with
`Failed to connect ... Error: Timeout (control socket)`, and a re-run of the
identical commit went green, live smoke test and all. Same build, same
artifacts, different outcome — transport, not the diff.

That instance was harmless because it died _before_ transferring anything, so
the site stayed on the previous good build. A timeout part-way through a sync
is the case worth guarding: the action tracks what it has uploaded in a state
file on the server, so a half-finished sync can leave that file disagreeing
with what is actually there, and the next incremental deploy trusts it.

**Fix:** wrap the two deploy steps in `.github/workflows/deploy.yml` in a retry
(`nick-fields/retry`, or a step that re-invokes the action on failure), and
consider raising `timeout` from its default. Re-running by hand works but only
when someone is watching, which is the thing this workstream has been trying to
stop relying on.

---

## @pitchfork-ui/tokens 0.4.0 is on npm without a license or README

Published 2026-09-21. Both entry points work from the registry — 137 values as
CSS custom properties and as JSON — but the version that went up predates the
packaging fix, so the tarball is three files and the npm page is blank:

```
dist.fileCount = 3          (variables.css, tokens.json, package.json)
description: <empty>   license: <empty>   homepage: <empty>
```

A published package with no declared license is the part that matters; the rest
is presentation.

**Fix:** already on `main` once the packaging change lands — it adds the
metadata, a README and a LICENSE to the tarball. It is committed as `fix:` so
release-please actually cuts 0.4.1; as a `chore:` it would have been hidden and
the correction would never have reached npm.

**Prerequisite:** that release publishes through OIDC, so
`@pitchfork-ui/tokens` needs a trusted publisher on npmjs.com first —
repository `lelandcrangel/pitchfork-ui`, workflow `release-please.yml`,
environment `release`. Without it the publish job fails on an otherwise good
release. This will be the first time any package in this repo publishes through
OIDC rather than by hand.

**Then:** `packages/mcp/src/data.mjs` resolves `@pitchfork-ui/tokens/tokens`
from the user's working directory before falling back to its bundled copy. That
branch could never fire while the package was unpublished, so the documented
"answers from _your_ installed copy" was true of metadata and silently untrue of
tokens. It is real now — no code change needed.
