# Contributing to PitchforkUI

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
