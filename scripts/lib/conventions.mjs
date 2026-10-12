/**
 * The house rules, lifted out of CLAUDE.md.
 *
 * They travel inside a metadata artifact because that is what gets published:
 * CLAUDE.md is not in any npm package, so the MCP server reading the metadata
 * at runtime could not otherwise see them. Without them an agent writes code
 * that works and does not look like it belongs here -- raw token names in
 * component CSS, a `div role="button"`, `aria-describedby` clobbered rather
 * than composed.
 *
 * Shared because both artifacts carry a set and the two sets are **not** the
 * same, which is the point. The React half's rules are about `forwardRef`, the
 * `pf-field` wrapper and BEM class names; the elements' are about the shadow
 * boundary, `::part()`, reflected attributes and form association. Handing an
 * agent writing `<pf-input>` the React component conventions would be worse
 * than handing it none: every rule in them is about a layer it is not using.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The sections a React consumer needs. Unchanged from what shipped, so the
 * deprecated half keeps answering exactly as it did.
 */
export const REACT_CONVENTION_SECTIONS = [
  '## Component conventions',
  '## Icon system',
  '## Form field pattern',
  '## Accessibility',
];

/**
 * The sections an elements consumer needs.
 *
 * Picked at H3 where the H2 mixes layers. `Component conventions` holds four
 * subsections and only two of them are layer-agnostic: the
 * component-var-to-alias-to-token chain and the mobile-first breakpoints,
 * which an agent that hardcodes a colour or a `min-width` has got wrong
 * whichever layer it is writing. The other two are about `forwardRef` and BEM
 * class names, which an element consumer does not have and should not be told
 * about.
 *
 * What is **not** here is CLAUDE.md's `Web components` section, and that is
 * deliberate. It is 74 KB of hard-won measurement written for someone editing
 * this repository -- which Vitest project cannot see a computed style, how to
 * probe a vacuous assertion -- and none of it is actionable for a consumer.
 * `apps/docs/src/WebComponents.mdx` is the consumer-facing prose, and it goes
 * in instead, through `readMdxConventions`.
 */
export const ELEMENT_CONVENTION_SECTIONS = [
  '### CSS variable inheritance chain',
  '### Responsive breakpoints',
  '## Icon system',
  '## Accessibility',
];

/**
 * @param {string[]} headings  Headings to lift, each written with its own
 *   `##`/`###` marker, in the order they should read. An H2 runs to the next
 *   H2 so its H3s come along; an H3 runs to the next heading of **any** depth,
 *   which is what makes picking one subsection out of a mixed H2 possible.
 * @param {(message: string) => void} warn  Called for a heading that is not there.
 */
export function readConventions(headings, warn) {
  const claude = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8');
  const sections = [];

  for (const heading of headings) {
    const start = claude.indexOf(`${heading}\n`);
    if (start === -1) {
      warn(`CLAUDE.md section "${heading}" not found — omitted from conventions`);
      continue;
    }

    const depth = heading.startsWith('### ') ? 3 : 2;
    const body = claude.slice(start + heading.length);
    // An H2 stops only at an H2; an H3 stops at either, or it would swallow
    // every later subsection of the same H2.
    const next = body.search(depth === 2 ? /\n## / : /\n##+ /);
    sections.push(
      (next === -1
        ? claude.slice(start)
        : claude.slice(start, start + heading.length + next)
      ).trim(),
    );
  }

  return sections.join('\n\n');
}

/**
 * An MDX docs page as plain prose.
 *
 * The scaffolding has to go: an `import`, a `<Meta>` and a `{/* *\/}` comment
 * are instructions to Storybook, not to a reader, and a model handed them
 * spends tokens on them and may copy them. Nothing else is touched -- the
 * tables and fenced code blocks are the content.
 */
export function readMdxConventions(file, warn) {
  const path = join(ROOT, file);
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch {
    warn(`${file} not found — omitted from conventions`);
    return '';
  }

  return text
    .replace(/^import[^\n]*\n/gm, '')
    .replace(/^<Meta[^\n]*\n/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}\n?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
