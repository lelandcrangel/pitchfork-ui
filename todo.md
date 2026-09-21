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

## @pitchfork-ui/tokens is versioned but never published

Pre-existing, and probably intentional — noting it so it is not mistaken for
fallout from the above. `release-please-config.json` versions the package and
cuts it a changelog, but the publish job only publishes `react` and `mcp`, so
npm has no `@pitchfork-ui/tokens`. Nothing depends on it being there:
`packages/react` takes it as a devDependency and inlines the built CSS.

**Decide:** either publish it, or drop it from release-please so it stops
getting version bumps and tags that lead nowhere.
