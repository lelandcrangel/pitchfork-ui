/**
 * Locating the data the server answers from.
 *
 * Order matters. An agent asking "what props does Button take?" wants the
 * answer for the version in *their* project, not whichever version this server
 * happens to ship with, so a locally installed @pitchfork-ui/react wins. The
 * bundled copy is what makes `npx @pitchfork-ui/mcp` work with no install.
 */

import { createRequire } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bundled = join(here, '..', 'data');

function fromConsumer(specifier) {
  try {
    // Resolve as though required from the user's working directory.
    const require = createRequire(pathToFileURL(join(process.cwd(), 'package.json')));
    const path = require.resolve(specifier);
    return existsSync(path) ? path : null;
  } catch {
    return null;
  }
}

function load(kind, { env, specifier, fallback }) {
  const candidates = [
    process.env[env] ? resolve(process.env[env]) : null,
    fromConsumer(specifier),
    join(bundled, fallback),
  ].filter(Boolean);

  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      return { data: JSON.parse(readFileSync(path, 'utf8')), path };
    } catch (error) {
      // A malformed file is worth reporting rather than silently skipping —
      // it is almost always a half-written build artifact.
      throw new Error(`Failed to parse ${kind} at ${path}: ${error.message}`, { cause: error });
    }
  }

  throw new Error(
    `Could not find ${kind}. Install @pitchfork-ui/react, or set ${env} to a ${fallback} path.`,
  );
}

export const { data: metadata, path: metadataPath } = load('component metadata', {
  env: 'PITCHFORK_UI_METADATA',
  specifier: '@pitchfork-ui/react/metadata',
  fallback: 'metadata.json',
});

export const { data: tokens, path: tokensPath } = load('design tokens', {
  env: 'PITCHFORK_UI_TOKENS',
  specifier: '@pitchfork-ui/tokens/tokens',
  fallback: 'tokens.json',
});

export const componentsByName = new Map(metadata.components.map((c) => [c.name, c]));

/**
 * What `Icon` resolves without the consumer registering anything.
 *
 * Checking a name against the canonical list alone produces false positives:
 * `Icon` also accepts a Font Awesome alias (`bar-chart` for `chart-bar`), a
 * legacy camelCase spelling (`circleCheck`), and a camelCase spelling of any
 * name at all (`chartBar`), because it kebab-cases before looking up. This
 * mirrors that resolution order exactly -- a validator that rejects working
 * code is worse than one that checks nothing.
 */
const iconRegistry = metadata.icons ?? {};

const customIconNames = new Set(iconRegistry.custom ?? []);
const fontAwesomeIconNames = new Set([
  ...(iconRegistry.fontAwesome ?? []),
  ...(iconRegistry.aliases ?? []),
]);
const legacyIconAliases = iconRegistry.legacyAliases ?? {};

const toKebabCase = (value) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** The canonical names, for suggesting a correction. */
export const iconNames = new Set(iconRegistry.all ?? []);

/**
 * False for metadata built before `icons` existed, which callers must treat as
 * "cannot check" rather than "nothing is valid".
 */
export const iconRegistryAvailable = customIconNames.size > 0 || fontAwesomeIconNames.size > 0;

export function resolvesIconName(name) {
  if (customIconNames.has(name)) return true;

  const normalized = legacyIconAliases[name] ?? toKebabCase(name);
  return customIconNames.has(normalized) || fontAwesomeIconNames.has(normalized);
}
