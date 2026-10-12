/**
 * The icon names a layer resolves with nothing registered, read from source.
 *
 * Shared because both metadata artifacts need it and the answer has to be the
 * same: `validate_usage` checks a name against this, and a validator that
 * accepts a name in one layer and rejects it in the other is worse than one
 * that checks nothing.
 *
 * Why it cannot simply be a list. `IconName` widens to `string`, because
 * `registerIcons()` can add names at runtime, so nothing in the type tells a
 * consumer which names work out of the box -- an unregistered `paper-plane`
 * looks perfectly valid and silently renders nothing. And the canonical names
 * alone are not enough to check against either: both layers also accept a Font
 * Awesome alias (`bar-chart` for `chart-bar`), a legacy camelCase spelling
 * (`circleCheck`), and a camelCase spelling of any name at all, because both
 * kebab-case before looking up.
 *
 * Three of the four inputs are in `@pitchfork-ui/core` and survive
 * `packages/react`: the custom glyphs, the legacy spellings, and
 * `BUNDLED_FA_ICON_NAMES`. The fourth cannot be shared and is the caller's to
 * name -- the `name: faXxx` map, which each layer has to write out itself so a
 * consumer's bundle carries only the icons in use. The aliases come from the
 * Font Awesome definitions that map points at, rather than being transcribed.
 */

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The text of an object literal, from its declaration to its closing brace.
 *
 * Braces are matched from the opening one so a nested object or a piece of JSX
 * cannot end the block early, and a missing declaration throws by name: the
 * registry being renamed or restructured has to fail loudly, or the metadata
 * publishes with no icons in it and nothing says so. That is not
 * hypothetical -- it is how the move of these lists into core was caught
 * immediately rather than shipping.
 */
function blockAfter(text, declaration, where) {
  const start = text.indexOf(declaration);
  if (start === -1) {
    throw new Error(
      `icon-registry: \`${declaration}\` not found in ${where}. The icon ` +
        'registry was renamed or restructured; update the caller.',
    );
  }

  let depth = 0;
  for (let i = text.indexOf('{', start); i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i);
    }
  }
  throw new Error(`icon-registry: unbalanced braces after \`${declaration}\` in ${where}`);
}

/**
 * The string literals in an array declaration, from its `[` to the matching
 * `]`. `blockAfter` cannot do this -- it matches braces, and an array has
 * none, so it runs to the end of the file and quietly returns the wrong thing.
 * Measured: pointed at `BUNDLED_FA_ICON_NAMES` it yielded an empty list, which
 * made the check below report all fifteen names as "extra" rather than
 * failing.
 */
function stringsIn(text, declaration, where) {
  const start = text.indexOf(declaration);
  if (start === -1) {
    throw new Error(
      `icon-registry: \`${declaration}\` not found in ${where}. The icon ` +
        'registry was renamed or restructured; update the caller.',
    );
  }

  let depth = 0;
  for (let i = text.indexOf('[', start); i < text.length; i += 1) {
    if (text[i] === '[') depth += 1;
    else if (text[i] === ']') {
      depth -= 1;
      if (depth === 0) {
        const names = [...text.slice(start, i).matchAll(/'([^']+)'/g)].map((m) => m[1]);
        if (names.length === 0) {
          throw new Error(`icon-registry: \`${declaration}\` in ${where} parsed empty`);
        }
        return names;
      }
    }
  }
  throw new Error(`icon-registry: unbalanced brackets after \`${declaration}\` in ${where}`);
}

/** Keys at one level of indentation: `name:` or `'kebab-name':`. */
const keysIn = (text, declaration, where) =>
  [...blockAfter(text, declaration, where).matchAll(/^ {2}'?([a-zA-Z][a-zA-Z0-9-]*)'?:/gm)].map(
    (m) => m[1],
  );

/**
 * @param {object} options
 * @param {string} options.bundledFile  Repo-relative file holding the `name: faXxx` map.
 * @param {string} options.declaration  That map's declaration, e.g. `const bundled = {`.
 */
export function readIconRegistry({ bundledFile, declaration }) {
  const glyphSource = readFileSync(join(ROOT, 'packages/core/src/custom-glyphs.ts'), 'utf8');
  const coreSource = readFileSync(join(ROOT, 'packages/core/src/icons.ts'), 'utf8');
  const bundledSource = readFileSync(join(ROOT, bundledFile), 'utf8');

  const custom = keysIn(glyphSource, 'export const CUSTOM_GLYPHS = {', 'core/custom-glyphs.ts');

  // name -> the `faXxx` export it is bound to.
  const bundled = new Map(
    [
      ...blockAfter(bundledSource, declaration, bundledFile).matchAll(
        /^ {2}'?([a-zA-Z][a-zA-Z0-9-]*)'?:\s*(fa[A-Za-z0-9]+)/gm,
      ),
    ].map((m) => [m[1], m[2]]),
  );

  const legacyAliases = Object.fromEntries(
    [
      ...blockAfter(
        coreSource,
        'const legacySpellings: Record<string, string> = {',
        'core/icons.ts',
      ).matchAll(/^ {2}([a-zA-Z][a-zA-Z0-9]*):\s*'([^']+)'/gm),
    ].map((m) => [m[1], m[2]]),
  );

  if (custom.length === 0 || bundled.size === 0) {
    throw new Error(`icon-registry: parsed an empty registry from ${bundledFile}`);
  }

  /*
   * The layer's own map against core's list, which is the assertion each
   * layer's unit test makes in TypeScript and this makes about the metadata.
   * Without it, an icon added to one layer and not the other produces metadata
   * claiming a name the other layer cannot draw.
   */
  const coreNames = stringsIn(
    glyphSource,
    'export const BUNDLED_FA_ICON_NAMES = [',
    'core/custom-glyphs.ts',
  );

  const missing = coreNames.filter((name) => !bundled.has(name));
  const extra = [...bundled.keys()].filter((name) => !coreNames.includes(name));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `icon-registry: ${bundledFile} disagrees with core's BUNDLED_FA_ICON_NAMES` +
        `${missing.length ? ` — missing ${missing.join(', ')}` : ''}` +
        `${extra.length ? ` — extra ${extra.join(', ')}` : ''}. One layer would ` +
        'draw a name the other cannot.',
    );
  }

  // A synchronous require: these scripts are otherwise entirely sync, and the
  // package is CJS, so there is nothing to gain from making the whole call
  // chain async for one lookup table.
  const fontAwesomeIcons = createRequire(import.meta.url)('@fortawesome/free-regular-svg-icons');
  const aliases = new Set();

  for (const [name, exportName] of bundled) {
    const definition = fontAwesomeIcons[exportName];
    if (!definition) {
      throw new Error(
        `icon-registry: ${bundledFile} binds "${name}" to ${exportName}, which ` +
          '@fortawesome/free-regular-svg-icons does not export.',
      );
    }
    // Font Awesome keeps an icon's former names in `icon[2]`, mixed in with
    // the unicode codepoints it also renders under.
    for (const alias of definition.icon?.[2] ?? []) {
      if (typeof alias === 'string') aliases.add(alias);
    }
  }

  const fontAwesome = [...bundled.keys()].sort();

  return {
    custom: [...custom].sort(),
    fontAwesome,
    aliases: [...aliases].sort(),
    legacyAliases,
    all: [...new Set([...custom, ...fontAwesome])].sort(),
    note:
      '`all` is what getAvailableIconNames() returns. Icon also resolves ' +
      'every entry in `aliases`, every key of `legacyAliases`, and a ' +
      'camelCase spelling of any of them. Anything else renders nothing ' +
      'until the consumer adds it with registerIcons().',
  };
}
