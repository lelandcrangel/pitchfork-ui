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

| Type | Description | Version bump |
|---|---|---|
| `fix` | Bug fix | patch (`0.0.x`) |
| `feat` | New feature | minor (`0.x.0`) |
| `feat!` or `BREAKING CHANGE:` footer | Breaking API change | major (`x.0.0`) |
| `chore`, `docs`, `style`, `refactor`, `test`, `build`, `ci` | Non-user-facing change | none |

### Examples

```
feat(Button): add loading prop with spinner
fix(Calendar): correct today border using warning-border token
docs: add Slider usage examples to MDX
refactor(theme): flatten CSS variable fallback chains
feat!: rename Badge size prop from "sm" to "small"

BREAKING CHANGE: the `sm` value on Badge's size prop has been renamed to `small`.
```

### Scopes

Use the component name in PascalCase as the scope when the change is specific to one component: `(Button)`, `(Calendar)`, `(Input)`. Omit the scope for workspace-wide changes.

---

## Release workflow

Releases are fully automated. When commits land on `main`:

1. The **release-please** GitHub Action opens (or updates) a Release PR titled `chore: release @pitchfork-ui/react vX.Y.Z`.
2. The PR contains the bumped version in `package.json` and an updated `CHANGELOG.md` — both generated from your commit messages.
3. **Merge the PR** when you are ready to ship. The action then creates a GitHub release and tags the commit.

> `feat:` and `fix:` commits accumulate in the Release PR until you merge it. There is no need to manually edit `package.json` or `CHANGELOG.md`.

Both `@pitchfork-ui/react` and `@pitchfork-ui/tokens` are versioned independently. A commit scoped to `packages/tokens` only bumps the tokens package; the react package is bumped only when its own files change.

---

## Component Standards

Every component should:

- Use semantic HTML first.
- Forward refs when it wraps a native interactive element.
- Support `className` and native HTML props.
- Use CSS variables generated from Style Dictionary tokens.
- Include Storybook stories with common states.
- Include at least one accessibility-focused test.
- Avoid unnecessary runtime dependencies.

## Component Folder Template

```txt
ComponentName/
  ComponentName.tsx
  ComponentName.css
  ComponentName.test.tsx
  ComponentName.stories.tsx
  index.ts
```

## API Guidance

Keep APIs small and predictable. Prefer native platform behavior before custom abstractions.
