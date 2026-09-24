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

## Publishing a new package: tick "Allow npm publish"

Not an open gap — all three trusted publishers are verified. Kept because this
will bite the next package added to the workspace, and this is where someone
would look.

On npmjs.com a package's trusted publisher has an **Allowed actions** section,
and **`Allow npm publish` is off by default** — the publisher may only _stage_ a
publish. The release workflow runs `npm publish`, so with the box unticked a
release fails at the publish step, after release-please has already cut the tag.

Tell the two failure modes apart by the message, not the exit code; the good
case and one bad case are both E403:

| Output                                   | Meaning                                                       |
| ---------------------------------------- | ------------------------------------------------------------- |
| `cannot publish over`                    | Authenticated, duplicate refused — the publisher is correct   |
| `OIDC permission denied for this action` | Publisher matches, `npm publish` not permitted — tick the box |
| `E404` on `PUT`, no provenance line      | No usable publisher; npm masks unauthorised writes as 404     |

`@pitchfork-ui/react`'s configuration is the known-good reference to copy.

**Check it without releasing:** Actions → _Verify npm trusted publisher_ → pick
the package. It attempts to publish a version already on the registry, which
exercises the whole OIDC path and cannot ship anything — npm authenticates
before it rejects a duplicate. `npm publish --dry-run` cannot do this; it never
authenticates at all.

Verified this way on 2026-09-21:

```
@pitchfork-ui/react   0.15.0  published via OIDC with provenance
@pitchfork-ui/tokens  0.4.1   published via OIDC with provenance
@pitchfork-ui/mcp     0.2.0   publisher verified; publishes on its next release
```

---

## `Icon` bundles 23 names, and the library's own components want more

`Icon` resolves an explicit registry — 12 Font Awesome regular icons imported
individually, plus 11 custom SVGs — rather than the whole free-regular set.
That is a deliberate bundle-size trade, and `registerIcons()` now lets a
consumer add anything else. But the registry has grown one panicked entry at a
time: `file-arrow-up` was added after `FileUploader` shipped rendering nothing,
and the same class of bug produced `clock`, `plus` and `minus`.

The gap is that nothing tells a _component author_ their icon isn't registered.
`validate_usage` catches it in generated JSX, and the console warns at runtime,
but a component added to `packages/react/src` referencing an unregistered name
passes every check in CI.

**Fix:** a lint rule, or a check in `build-metadata.mjs`, that scans component
source for `iconName="…"` / `<Icon name="…">` literals and fails on any name
outside the registry — the same check `validate_usage` already does for
consumer code, applied to the library's own.

---

## Root `optionalDependencies` pin OXC bindings nothing consumes

`package.json` pins `@oxc-parser/binding-linux-x64-gnu` and
`@oxc-resolver/binding-linux-x64-gnu` at exact versions in
`optionalDependencies` — a workaround for npm omitting platform-specific
optional dependencies from the lockfile, which broke `npm ci` on CI.

The pins have since drifted away from the packages that actually use them.
Today the root pins 0.150.0 and 11.24.2, while `oxc-parser@0.127.0` and
`oxc-resolver@11.21.2` each require their own exact match — so npm installs
the pinned versions at the top level, nests the correct ones underneath, and
nothing ever loads the pinned copies. Verified: both modules load, and the
bindings they load are the nested ones.

It works, but Dependabot now bumps these pins on their own schedule,
unanchored to any consumer, and each bump is a change that cannot affect
anything. Copilot flagged the drift on
[#98](https://github.com/lelandcrangel/pitchfork-ui/pull/98).

**Fix:** check whether the npm bug that prompted the pins is still live (it
was fixed in npm 10.x for most cases). If it is, tie the pins to the
consumers' versions and add a check that they match. If it isn't, drop both
pins and the `optionalDependencies` block with them.
