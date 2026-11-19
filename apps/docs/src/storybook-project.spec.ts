import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { controlsForStoryTitle } from '../.storybook/CssVariableDecorator';

/**
 * The invariants the generated element pages depend on, checked without a
 * browser or a Storybook build.
 *
 * This file used to assert that the React component pages kept their
 * Interactive controls out of the MDX. Those pages are gone, and the
 * equivalent for the generated pages is enforced far more strongly by
 * `build-elements-docs --verify`, which compares the generator's own bytes.
 * What is left worth checking is the pairing: a page and a story per element,
 * each attached the one way that produces a single sidebar entry with two
 * children.
 *
 * It is also now actually run. `npm run test:docs` is in CI; before, nothing
 * invoked the root `vitest.config.ts` at all, so these assertions had never
 * failed a build in their lives.
 */
const elementsDir = join(dirname(fileURLToPath(import.meta.url)), 'elements');
const files = readdirSync(elementsDir);
const pages = files.filter((file) => file.endsWith('.mdx'));
const stories = files.filter((file) => file.endsWith('.stories.tsx'));

describe('generated element pages', () => {
  it('pairs every page with a stories file', () => {
    expect(pages.length).toBeGreaterThan(100);
    expect(stories.length).toBe(pages.length);

    const storyNames = new Set(stories.map((file) => file.replace('.stories.tsx', '')));
    for (const page of pages) {
      expect(storyNames.has(page.replace('.mdx', '')), `${page} has no stories file`).toBe(true);
    }
  });

  it('attaches each page to its stories rather than naming a title', () => {
    // A title in both the MDX and the stories file makes two sidebar entries
    // instead of one entry with Docs and Interactive under it.
    for (const page of pages) {
      const name = page.replace('.mdx', '');
      const mdx = readFileSync(join(elementsDir, page), 'utf8');
      expect(mdx, `${page} should attach with <Meta of=>`).toContain(
        `<Meta of={${name}Stories} />`,
      );
      expect(mdx, `${page} should not carry a title of its own`).not.toContain('<Meta title=');
    }
  });

  it('files every element under Components, with no Pf prefix', () => {
    for (const file of stories) {
      const name = file.replace('.stories.tsx', '');
      const source = readFileSync(join(elementsDir, file), 'utf8');
      expect(source, `${file} should be titled Components/${name}`).toContain(
        `title: 'Components/${name}',`,
      );
      expect(name.startsWith('Pf'), `${file} still carries the Pf prefix`).toBe(false);
      expect(source, `${file} should export Interactive`).toContain('export const Interactive');
    }
  });
});

/*
 * The CSS Variables panel on an Interactive story shows the controls for its
 * scope, and the scope comes from the story title. It used to come from a
 * hand-kept map written for the React stories' titles, which the element
 * stories never matched: 68 of 112 showed no panel, the newest four included,
 * and nothing failed. This holds it the other way round: an element whose
 * stylesheet reads a `--pf-*` variable must get a panel.
 */
describe('the CSS Variables panel', () => {
  const componentsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../packages/elements/src/components',
  );

  it('has controls for every element whose stylesheet reads a --pf-* variable', () => {
    const missing: string[] = [];
    for (const file of stories) {
      const name = file.replace('.stories.tsx', '');
      const tag = `pf-${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
      const css = join(componentsDir, tag, `${tag}.css`);
      if (!existsSync(css)) continue; // no stylesheet, so nothing to control
      const source = readFileSync(css, 'utf8');
      if (!/var\(--pf-/.test(source)) continue;
      if (controlsForStoryTitle(`Components/${name}`).length === 0) missing.push(name);
    }
    expect(missing, `no CSS Variables panel for: ${missing.join(', ')}`).toEqual([]);
  });
});
