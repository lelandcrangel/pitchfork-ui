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
