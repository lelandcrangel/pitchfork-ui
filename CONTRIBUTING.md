# Contributing to PitchforkUI

## Commit Format

This project uses **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** to drive automated semantic versioning via [release-please](https://github.com/googleapis/release-please).

Every commit message must follow this structure:

```
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

### Types and version impact

| Type                                                        | Description            | Version bump    |
| ----------------------------------------------------------- | ---------------------- | --------------- |
| `fix`                                                       | Bug fix                | patch (`0.0.x`) |
| `feat`                                                      | New feature            | minor (`0.x.0`) |
| `feat!` or `BREAKING CHANGE:` footer                        | Breaking API change    | minor while 0.x |
| `chore`, `docs`, `style`, `refactor`, `test`, `build`, `ci` | Non-user-facing change | none            |

Every package is still below 1.0, and release-please is set to
`bump-minor-pre-major`, so a breaking change moves `0.4.0` to `0.5.0`, not to
`1.0.0`.

### Examples

```
feat(elements): add a clearable option to the input
fix(elements): keep the date picker's panel inside the viewport
fix(mcp): report a property-only prop written in markup
docs: correct the theming page's override example
feat(elements)!: rename the tabs change event

BREAKING CHANGE: pf-tabs emits pfTabChange instead of pfChange.
```

**Never write a tag with its angle brackets in a commit message**, backticks or
not. The message becomes release notes in two places that read it as markup: the
docs changelog page is MDX, and release-please parses the release PR's body as
HTML to decide what to tag. Write "the pf-icon element" instead.

### Scopes

Use the package as the scope: `(elements)`, `(core)`, `(tokens)`, `(mcp)`,
`(elements-react)`, `(docs)`. Omit the scope for a change across the workspace.

---

## Release workflow

Releases are automated, with two approvals on the way. When commits land on
`main`:

1. The **release-please** action opens or updates one release PR, `chore:
release main`, covering every package whose folder those commits touched,
   each with its bumped version and `CHANGELOG.md`.
2. **Merge it** when you are ready to ship. `main` requires an approving review,
   and the release PR needs one like any other.
3. The action tags each package and creates its GitHub release, then the
   **publish** job waits for approval on the `release` environment. Approve it
   in the run, and it publishes to npm with provenance.

A package is versioned only from commits that touch **its own folder**. That
matters for the generated bindings: a change to an element that changes what a
binding exports reaches `@pitchfork-ui/elements-react` with no commit in its
folder, so release-please would give it a patch at most. When an element change
breaks a binding's API, add a commit in the binding's own folder — its README is
the natural place — marked as breaking.

`release-please-config.json` uses the `node-workspace` plugin, which rewrites
the ranges between the packages (`^0.3.0` → `^0.4.0`) as part of the release.

---

## Adding an element

New components are custom elements in `packages/elements`. `packages/react` is
deprecated and takes no new components. `CLAUDE.md`'s **Web components**
section has the reasoning behind each rule here, and it is worth reading before
the first one.

```txt
packages/elements/src/components/pf-name/
  pf-name.tsx                 the component class, and nothing else exported
  pf-name.css                 its shadow-root styles
  pf-name.spec.tsx            unit tests, in Stencil's mock DOM
  pf-name.browser.spec.tsx    browser tests, in Chromium
```

### Checklist for every new element

- [ ] The component, with a doc comment that says what it is for, and `@slot`
      and `@part` tags for each slot and part. The generated docs page is built
      from it, and `--strict` fails an element with none.
- [ ] Its stylesheet reads `--pf-*` aliases only, never a raw `--color-*`
      token. Each alias is defined in `packages/tokens/src/theme.css`, and one
      for anything that should change in dark mode names a **semantic** token.
- [ ] Tests. Anything form-associated, anything keyboard-driven and anything
      that reacts to slotted content is tested in the browser project; the mock
      DOM cannot see it. At least one test is about accessibility.
- [ ] An entry in `apps/docs/src/element-examples.ts`, with an `interactive`
      single instance when the example shows several.
- [ ] Its category in `CATEGORY` in `scripts/build-elements-metadata.mjs`, or
      its parent in `CHILD_OF` if it only makes sense inside one.
- [ ] `npm run build:elements` and `npm run build:elements-docs`, which write its
      docs page, its Interactive story and the three bindings. Commit the page
      and the story; never edit them by hand.
- [ ] The tag in the consumer apps and the `EXPECTED` list in
      `scripts/smoke-consumer.mjs`, with an assertion on any computed style the
      unit tests cannot see.
- [ ] `npm run check:examples`, `check:events` and `check:css-vars` pass.

### Rules the checks hold

- Reflect any prop the stylesheet or a selector reads, and select variants on
  attributes (`:host([variant='primary'])`), not classes.
- A form control is `formAssociated` with `@AttachInternals()`, reflects `name`,
  and has `formResetCallback` and `formDisabledCallback`.
- Only a form control emits `pfChange` and `pfInput`. Every other event is
  `@Event({ bubbles: false })` unless a parent element listens for it, and a
  container's own change event has a name of its own.
- Data-driven elements take child elements, not array props.

---

## API Guidance

Keep APIs small and predictable. Prefer native platform behaviour before custom
abstractions.

---

## Responsive Design

This project uses a **mobile-first** approach: base styles target mobile, and `@media (--breakpoint)` queries layer in wider-screen overrides.

### Breakpoints

| Name   | Min-width | Use for                                                                  |
| ------ | --------- | ------------------------------------------------------------------------ |
| `--sm` | 640px     | Small layout shifts (stacked → inline)                                   |
| `--md` | 768px     | Medium layout changes (single-col → multi-col nav, sheet → dialog modal) |
| `--lg` | 1024px    | Large/desktop layouts                                                    |

### Usage

```css
/* base = mobile */
.pf-my-component {
  flex-direction: column;
}

/* override for sm and up */
@media (--sm) {
  .pf-my-component {
    flex-direction: row;
  }
}
```

Breakpoints are resolved at build time by `postcss-custom-media`. The canonical definitions live in `packages/tokens/src/theme.css` and are provided to PostCSS via `packages/react/vite.config.ts`, `packages/elements/stencil.config.ts` and `apps/docs/.storybook/main.ts`.

Do not use raw `min-width` or `max-width` pixel values in component CSS — always use the named breakpoints above.

---

## No Inline Styles

Do not use the `style` attribute in component source. Inline styles cannot be overridden by consumers and are harder to debug in browser devtools.

- Put layout and visual rules in CSS using the token variable chain.
- For a value that must be dynamic, set a CSS custom property on the element and read it in the component's CSS — this keeps the override surface in CSS where it belongs.
- In the examples in `apps/docs/src/element-examples.ts`, size constraints belong to the layout around the element, not on it. A card sized by its container is a more honest example than one with a hardcoded width.

---

---

## Documentation

The element pages in `apps/docs/src/elements/` are generated from the
components' doc comments and `element-examples.ts`, and `--verify` in CI fails
on one that is stale. Each has a Docs page and an Interactive story; the
story's controls come from the element's props, and its CSS Variables panel
from the `--pf-*` variables its stylesheet reads. Neither needs registering.

The Foundations pages (`apps/docs/src/*.mdx`) are hand-written. Keep an MDX
comment on one line: Prettier rewrites a multi-line one into something MDX
cannot parse.
