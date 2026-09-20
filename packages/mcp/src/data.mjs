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
