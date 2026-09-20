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

## @pitchfork-ui/mcp is not on npm yet

The publish job for the 0.15.0 release published `@pitchfork-ui/react` and then
failed on `@pitchfork-ui/mcp`:

```
npm error 404 Not Found - PUT https://registry.npmjs.org/@pitchfork-ui%2fmcp
npm error 404  The requested resource '@pitchfork-ui/mcp@0.2.0' could not be
               found or you do not have permission to access it.
```

The tarball was built correctly — `npm notice total files: 7`, including
`data/metadata.json` and `data/tokens.json`. The failure is a registry
permission, and the 404 is misleading: npm returns 404 both for "does not
exist" and for "exists but you may not write to it".

This is the trusted-publishing bootstrap problem. Trusted publishers are
configured **per package** on npmjs.com, and a package that does not exist yet
cannot have one, so OIDC cannot create it. `@pitchfork-ui/react` publishes fine
because its trusted publisher was configured for earlier releases.

**Fix**, once, from a machine logged in to npm:

```bash
npm run build:tokens
npm run build:react
npm run build:metadata   # writes packages/react/dist/metadata.json
npm run build:mcp        # copies it and tokens.json into packages/mcp/data/
npm publish --workspace @pitchfork-ui/mcp --access public
```

The build order matters: `packages/mcp/data/` is gitignored and produced by
`build:mcp`, and the package's `files` allowlist ships it. Publishing without
that step produces a server with no bundled fallback data.

Then add the trusted publisher on npmjs.com for the new package — repository
`lelandcrangel/pitchfork-ui`, workflow `release-please.yml` — and CI handles
every release after this one.

Until it is published, `npx @pitchfork-ui/mcp` does not work. That command
appears in `packages/mcp/README.md`, `.claude/skills/pitchfork-ui/SKILL.md` and
the "Using with AI" docs page.

---

Once it is published, four places swap the checkout for the package:

- `apps/docs/src/UsingWithAI.mdx` — the "not on npm yet" paragraph under
  _Install it_, and the "Once the package is published" callout below it, which
  then becomes the whole of that section.
- `apps/docs/src/UsingWithAI.mdx` — the two `PITCHFORK_UI_METADATA` examples
  under _Getting the most out of it_, both of which run `node` against a
  checkout path and become `npx -y @pitchfork-ui/mcp`.
- `README.md` — the "not on npm yet" paragraph under _Using it with a coding
  agent_, where the checkout config gives way to the `claude mcp add` one-liner
  already shown beneath it.

The rule that keeps these honest: no command in the docs should 404 for a reader
following it today. Grepping for `npx -y @pitchfork-ui/mcp` finds every one.

---

## @pitchfork-ui/tokens is versioned but never published

Pre-existing, and probably intentional — noting it so it is not mistaken for
fallout from the above. `release-please-config.json` versions the package and
cuts it a changelog, but the publish job only publishes `react` and `mcp`, so
npm has no `@pitchfork-ui/tokens`. Nothing depends on it being there:
`packages/react` takes it as a devDependency and inlines the built CSS.

**Decide:** either publish it, or drop it from release-please so it stops
getting version bumps and tags that lead nowhere.
