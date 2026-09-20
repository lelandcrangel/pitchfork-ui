# Known gaps

Tracked here rather than in issues when the fix is small, well understood, and
does not need discussion. Referenced from `CLAUDE.md`.

---

## Storybook changelog page is stale and reformats on build

`apps/docs/src/CHANGELOG.mdx` is generated from `packages/react/CHANGELOG.md` by
`apps/docs/sync-changelog.cjs`, which runs as a pre-step of both `storybook` and
`build`. Two problems:

1. **The committed copy is stale.** It predates the 0.14.0 release, so the
   published changelog page is missing the most recent entries, including a
   breaking change.
2. **The regenerated copy is not Prettier-formatted**, so `npm run build`
   followed by `npm run format:check` fails on a clean tree.

CI does not catch either, because `format:check` runs _before_ `build` — the
committed file passes, and the regenerated one is never re-checked.

**Fix:** have `sync-changelog.cjs` write Prettier-formatted output (or run
Prettier over its output), then commit the regenerated file. Optionally move
`format:check` after `build` in `.github/workflows/ci.yml` so drift is caught.

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

## Carousel examples do not demonstrate its required prop

`Carousel` requires `slides`, but the four stories in
`apps/docs/src/Carousel.examples.stories.tsx` supply it through `render` rather
than `args`. The metadata extractor therefore cannot synthesise a usable example
— synthesis produces `<Carousel />`, which does not work — and drops all four
rather than publish something misleading. `Carousel` is currently the only
component in the library shipping no examples in `metadata.json`,
`llms-full.txt` or the MCP server.

Surfaced by running `validate_usage` across every extracted example.

**Fix:** move `slides` into the story `args`, or add an explicit
`parameters.docs.source.code` block to each story, per the convention in
`CLAUDE.md`.
