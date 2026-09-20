# Pitchfork UI — AI Kit Build Plan

A turnkey plan for making `@pitchfork-ui/react` **machine-consumable**, so coding
agents (Claude Code, Cursor, Copilot) can build with the library correctly —
right props, right tokens, right accessibility contract — without guessing.

**Goal:** an agent pointed at Pitchfork UI produces code that looks like it was
written by someone who knows the design system. No hallucinated props, no
hardcoded hex colors, no `<div role="button">`.

---

## 0. Guiding principles

- **Generate, never hand-write.** Every machine-readable artifact is derived from
  source at build time. A hand-maintained copy of the API drifts within one release.
- **The source of truth is already here.** Props live in the TS interfaces, usage
  lives in the stories, rules live in `CLAUDE.md`. This project is extraction and
  serving — not authoring.
- **Ship it versioned.** Metadata travels inside the npm package, so an agent
  resolving `@pitchfork-ui/react@0.14.0` gets that version's API, not `main`'s.
- **Teach the chain, not the value.** The differentiator over a generic docgen dump
  is the **CSS variable inheritance chain** (`component var → theme alias → token`).
  An agent that knows this themes correctly; one that doesn't writes `#4f46e5`.
- **Degrade gracefully.** `llms.txt` needs no install. The MCP server is the
  high-fidelity path. Both stay in sync because both derive from Phase 1.

---

## 1. What already exists (the corpus)

This plan is tractable because the documentation work is effectively done:

| Asset           | State                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| Components      | 74, one folder each under `packages/react/src/components/`                    |
| Typed props     | `ComponentNameProps` interface exported for every component                   |
| MDX doc pages   | 79 — full coverage (`LineBarCharts` is a barrel, documented as Area/Line/Bar) |
| Example stories | 75 `*.examples.stories.tsx`                                                   |
| Tests           | 74/74 components have a test file                                             |
| Tokens          | Style Dictionary already emits `dist/json/tokens.json`                        |
| Conventions     | `CLAUDE.md` already encodes the rules an agent needs                          |

**Known corpus inconsistency:** 22 of the 75 example files are args-only and carry
no `parameters.docs.source.code`, though `CLAUDE.md` mandates it — `Alert`,
`Badge`, `BadgeGroup`, `Button`, `Carousel`, `Checkbox`, `CodeSnippet`,
`CreditCard`, `DatePicker`, `FileUploader`, `InlineCTA`, `Input`, `PageHeader`,
`Pagination`, `RichTextEditor`, `SectionFooter`, `SectionHeader`, `Slider`,
`Switch`, `Tag`, `Textarea`, `VideoPlayer`.

Do **not** block Phase 1 on hand-editing these. The extractor synthesizes JSX from
`args` (`{variant: 'info', heading: 'Heads up'}` → `<Alert variant="info"
heading="Heads up" />`) and prefers the explicit `source.code` string when present.
Normalize the stragglers opportunistically afterward.

---

## 2. Phase 1 — Metadata extraction (the keystone)

Everything downstream derives from this artifact, so it ships first.

**New:** `scripts/build-metadata.mjs` → `packages/react/dist/metadata.json`

### 2a. What to extract, and from where

| Field                 | Source                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `name`, `importPath`  | `packages/react/src/index.ts`                                                                     |
| `props[]`             | TS compiler API over `components/*/*.tsx` — name, type, union members, default, required, JSDoc   |
| `cssVars[]`           | Scrape `components/*/*.css` for `--pf-*`, then resolve the alias chain through `styles/theme.css` |
| `examples[]`          | `apps/docs/src/*.examples.stories.tsx` — explicit `source.code`, else synthesized from `args`     |
| `description`, `a11y` | `apps/docs/src/*.mdx` prose                                                                       |
| `category`            | Reuse the grouping already established in `FIGMA-KIT-PLAN.md` §2                                  |

### 2b. Shape

```jsonc
{
  "version": "0.14.0",
  "components": [
    {
      "name": "Alert",
      "category": "feedback",
      "importPath": "@pitchfork-ui/react",
      "description": "Alert surfaces contextual feedback with semantic variants...",
      "props": [
        {
          "name": "variant",
          "type": "'info' | 'success' | 'warning' | 'danger'",
          "default": "'info'",
          "required": false,
        },
      ],
      "cssVars": [{ "name": "--pf-alert-info-bg", "alias": "--color-semantic-status-info-bg" }],
      "a11y": "warning/danger use role=\"alert\" (assertive); info/success use role=\"status\".",
      "examples": [{ "name": "Info", "code": "<Alert variant=\"info\" heading=\"Heads up\" />" }],
    },
  ],
}
```

The `cssVars` block with its resolved `alias` is the part no off-the-shelf docgen
produces, and the reason an agent using this themes correctly.

### 2c. Wiring

- Build order becomes **tokens → react → metadata → docs**; update the root
  `build`, `build:hostinger`, and `build:demo` scripts.
- Add to `packages/react/package.json`:
  ```jsonc
  "exports": { "./metadata": "./dist/metadata.json" }
  ```
- Add `dist/metadata.json` to the published `files` (already covered by `dist`).

---

## 3. Phase 2 — `llms.txt`

Generated from the Phase 1 artifact, so it cannot drift.

- `apps/docs/public/llms.txt` — component index plus links, per the emerging
  convention. Lands at `lelandrangel.com/pitchfork-ui/llms.txt`.
- `apps/docs/public/llms-full.txt` — the whole library flattened for a single
  fetch: components, props, token tree, conventions, one example each.

Cheap once Phase 1 exists, and it is the zero-friction entry point — no install,
no MCP client, just a URL an agent can read.

---

## 4. Phase 3 — `@pitchfork-ui/mcp`

New workspace package (`packages/mcp`), stdio transport, published to npm.

### 4a. Tools

| Tool                | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| `list_components`   | All components, optionally filtered by category                                         |
| `search_components` | Natural language → component ("something for file upload")                              |
| `get_component`     | Props, variants, a11y contract, CSS variables                                           |
| `get_examples`      | Working JSX for a component                                                             |
| `get_tokens`        | The design token tree, light and dark                                                   |
| `get_conventions`   | The `CLAUDE.md` rules — `cx`, `forwardRef`, `pf-` naming, the token chain, mobile-first |
| `validate_usage`    | Check a JSX snippet against the real prop types                                         |

`validate_usage` is the differentiator — most component-library MCP servers only
read. A tool that tells an agent _"`Badge` has no `size` prop"_ closes the loop.

### 4b. Packaging

- Add `packages/mcp` to `release-please-config.json` (the config already handles
  multiple packages with `separate-pull-requests: false`).
- README with the `claude mcp add` snippet and a JSON config block.
- Reads `@pitchfork-ui/react/metadata` — so the server is a thin serving layer with
  no duplicated knowledge.

---

## 5. Phase 4 — Agent-facing repo files

- `.claude/skills/pitchfork-ui/SKILL.md` — so Claude Code users in _consuming_
  projects pick up the conventions automatically, not just those working in this repo.
- Keep it thin: point at the MCP tools rather than restating the API, which would
  reintroduce the drift problem.

---

## 6. Phase 5 — Showcase

This is the portfolio deliverable. Publishing it is not the same as showing it.

- **Storybook docs page — "Using Pitchfork UI with AI."** Setup, the tools, and what
  each artifact is for.
- **Side-by-side demo.** The same prompt ("build a settings page with a form")
  run twice:
  - _Without_ the MCP server — hallucinated props, hardcoded hex, `<div role="button">`.
  - _With_ it — real props, `var(--pf-*)` aliases, semantic HTML.

  That contrast is the whole pitch and it demos in about thirty seconds. Capture it
  as a recording or a static diff so it survives on the site without a live model.

- README section plus a line in the package description.

---

## 7. CI & maintenance

- **Extractor gate** in `.github/workflows/ci.yml`: `npm run build:metadata -- --strict`.
  The plan originally called for a "regenerate and diff" freshness check; that does
  not apply, because `dist/` is gitignored, so there is no committed copy to drift
  from. What is worth gating on instead is the extractor still understanding the
  codebase: a new component nobody categorised, a CSS variable that resolves to
  nothing, a story whose usage cannot be read. `--strict` exits non-zero on any of
  those, against a documented known-issues allowlist. Same spirit as open issue #26
  (validate published artifacts, not just source).
- Run `validate_usage` against every extracted example in CI — if an example no
  longer type-checks against its own component, both the docs and the agent output
  are wrong.
- Regenerate on every release; metadata version tracks the package version.
- When a component gains a prop or variant, no manual step should be required.
  If one is, the extractor has a gap — fix the extractor, not the artifact.

---

## 8. Open decisions

1. **`packages/mcp` in-repo or standalone?** Recommend **in-repo** — metadata stays
   in lockstep and release-please already handles multi-package releases. Revisit
   only if the MCP dependency tree starts to bloat the library.
2. **Does the `ai-generated` story tag belong in public metadata?** It appears in
   130 of the 231 files under `apps/docs/src/`, so it is a deliberate provenance
   convention, not a stray. Decide whether it stays internal or ships as a
   `provenance` field before it becomes part of a published artifact.
3. **`todo.md`** — `CLAUDE.md` "Known gaps" points at a root `todo.md` that is listed
   in `.gitignore`, so it is deliberately local-only and simply absent from a fresh
   clone. Not a bug; decide whether a shared gaps list belongs in the repo.
4. **Category taxonomy** — reuse `FIGMA-KIT-PLAN.md` §2 groupings verbatim so the
   Figma kit, Storybook sidebar, and AI metadata all agree. Settled in Phase 1:
   `CATEGORIES` in `scripts/build-metadata.mjs` is the shared list, and a component
   missing from it fails `--strict`.
5. **Timeline marker variables** — surfaced by the extractor, not previously known,
   and now resolved. `.pf-timeline__marker` read `--pf-timeline-marker-bg`,
   `-border` and `-icon`, which were defined nowhere; every marker renders with a
   `--<tone>` modifier that overrode all three, so they were dead declarations and
   have been removed. The base rule keeps the border geometry (`border-style` /
   `border-width`) and the tone modifier supplies the colour. With that gone,
   `--strict` needs no known-issues allowlist and fails on any warning at all.

---

## 9. Sequencing

| Phase                   | Blocks      | Notes                                     |
| ----------------------- | ----------- | ----------------------------------------- |
| 1 — Metadata extraction | everything  | The keystone. Do this first, do it well.  |
| 2 — `llms.txt`          | needs 1     | Small once 1 lands. Highest reach/effort. |
| 3 — MCP server          | needs 1     | Parallel with 2.                          |
| 4 — Skill file          | needs 3     | Thin.                                     |
| 5 — Showcase            | needs 2 + 3 | The portfolio artifact.                   |
| CI gate                 | needs 1     | Land with Phase 1, not after.             |

Phases 2 and 3 are parallelizable once Phase 1 is stable. Resist starting 3 before
1 is settled — a metadata schema change ripples through every tool.

---

## Reference — source of truth in this repo

- Components: `packages/react/src/components/*` (74 folders)
- Public API surface: `packages/react/src/index.ts`
- Conventions an agent must know: `CLAUDE.md`
- Tokens: `packages/tokens/src/tokens/*.json` → `dist/json/tokens.json`
- Theme aliases + dark mode: `packages/react/src/styles/theme.css`
- Examples corpus: `apps/docs/src/*.examples.stories.tsx`
- Prose + a11y notes: `apps/docs/src/*.mdx`
- Existing build script precedent: `scripts/check-dark-contrast.mjs`
- Live reference: Storybook at `lelandrangel.com/pitchfork-ui`
- Commit format (required): Conventional Commits — see `CONTRIBUTING.md`
