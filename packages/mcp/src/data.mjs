/**
 * Locating the data the server answers from.
 *
 * Order matters. An agent asking "what props does `pf-select` take?" wants the
 * answer for the version in *their* project, not whichever version this server
 * happens to ship with, so a locally installed `@pitchfork-ui/elements` wins.
 * The bundled copy is what makes `npx @pitchfork-ui/mcp` work with no install.
 *
 * The element metadata is **required** and the React metadata is **optional**.
 * That was the other way round until `packages/react` was put on its way out,
 * and the old arrangement had a real consequence: a consumer who had installed
 * only `@pitchfork-ui/elements` got a server that refused to start, because the
 * artifact it insisted on belonged to a package they had no reason to have.
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

function load(kind, { env, specifier, fallback, install, optional = false }) {
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

  if (optional) return { data: null, path: null };

  throw new Error(
    `Could not find ${kind}. Install ${install}, or set ${env} to a ${fallback} path.`,
  );
}

/*
 * The elements are the library, so this is the artifact the server cannot run
 * without. Derived from Stencil's `docs.json` rather than parsed out of
 * TypeScript, which is why it records every prop, event, method, slot and part
 * without anyone maintaining a list.
 */
export const { data: elementMetadata, path: elementMetadataPath } = load('element metadata', {
  env: 'PITCHFORK_UI_ELEMENTS',
  specifier: '@pitchfork-ui/elements/metadata',
  install: '@pitchfork-ui/elements',
  fallback: 'elements.json',
});

export const { data: tokens, path: tokensPath } = load('design tokens', {
  env: 'PITCHFORK_UI_TOKENS',
  specifier: '@pitchfork-ui/tokens/tokens',
  install: '@pitchfork-ui/tokens',
  fallback: 'tokens.json',
});

/*
 * The deprecated React layer, and `null` once it is gone. The three tools that
 * answer from it say so rather than failing, which is the whole reason it is
 * optional: a consumer on the elements alone should not have to install a
 * retired package to start the server.
 */
export const { data: metadata, path: metadataPath } = load('component metadata', {
  env: 'PITCHFORK_UI_METADATA',
  specifier: '@pitchfork-ui/react/metadata',
  install: '@pitchfork-ui/react',
  fallback: 'metadata.json',
  optional: true,
});

/** True while the deprecated React layer's metadata is available to answer from. */
export const hasReactLayer = metadata !== null;

export const componentsByName = new Map((metadata?.components ?? []).map((c) => [c.name, c]));

/** Keyed by tag (`pf-button`) and by binding name (`PfButton`), since an agent has either. */
export const elementsByTag = new Map(elementMetadata.elements.map((e) => [e.tag, e]));
export const elementsByName = new Map(elementMetadata.elements.map((e) => [e.name, e]));

/** React component name -> the element that answers for it, counterpart or absorption. */
export const elementForComponent = new Map(Object.entries(elementMetadata.reactCoverage ?? {}));

/**
 * What an icon name resolves to without the consumer registering anything.
 *
 * Checking a name against the canonical list alone produces false positives:
 * both layers also accept a Font Awesome alias (`bar-chart` for `chart-bar`), a
 * legacy camelCase spelling (`circleCheck`), and a camelCase spelling of any
 * name at all (`chartBar`), because both kebab-case before looking up. This
 * mirrors that resolution order exactly -- a validator that rejects working
 * code is worse than one that checks nothing.
 *
 * From the element metadata, falling back to the React metadata for an older
 * artifact that predates `icons` being carried there. It used to be the other
 * way round, so a name in `<pf-icon>` was checked against the *React*
 * registry -- harmless only because `scripts/lib/icon-registry.mjs` asserts
 * the two layers' lists against core's and fails the build when they diverge.
 */
const iconRegistry = elementMetadata.icons ?? metadata?.icons ?? {};

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
