#!/usr/bin/env node
// smoke-storybook.mjs
//
// Renders the BUILT Storybook in a real browser and asserts that it is styled.
//
// The unit suite renders components from source in jsdom, where theme.css is
// imported directly, so it cannot see a bundler regression: 933 tests passed
// while every published component rendered with no design tokens at all. The
// tokens live on :root and come from one file; if that file is tree-shaken out
// of the bundle, the markup and class names are still perfect and nothing
// errors. Only a real browser looking at real build output can tell.
//
// Two targets, one check:
//
//   --dir  apps/docs/storybook-static     CI, against what was just built
//   --base https://example.com/some-path  post-deploy, against what is served
//
// The second matters because a correct bundle uploaded to the wrong place, or
// a stale one left in place, both look identical from inside CI.

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

// Sampled per story. These are the ones whose absence produced a site that
// looked structurally perfect and completely unstyled.
const TOKENS = [
  '--color-semantic-action-primary',
  '--color-semantic-text-default',
  '--pf-button-primary-bg',
  '--space-4',
  '--radius-md',
];

// One concrete end-to-end proof to go with the token check. A primary button
// with a transparent background is the exact symptom this script exists for.
const ANCHOR = {
  storyId: 'components-button--interactive',
  selector: '.pf-button',
  describe: 'primary Button',
};

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.txt': 'text/plain; charset=utf-8',
};

function parseArgs(argv) {
  const args = { dir: null, base: null, sample: 6 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir') args.dir = argv[(i += 1)];
    else if (arg === '--base') args.base = argv[(i += 1)];
    else if (arg === '--sample') args.sample = Number(argv[(i += 1)]);
  }
  if (!args.dir && !args.base) args.dir = 'apps/docs/storybook-static';
  if (!Number.isInteger(args.sample) || args.sample < 1) {
    throw new Error('--sample must be a positive integer');
  }
  return args;
}

// A static server just good enough to serve a Storybook build. Kept here rather
// than shelling out so the script has no dependency beyond playwright.
async function serve(dir) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(root)) {
      res.writeHead(403).end();
      return;
    }
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => server.close() };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'cache-control': 'no-cache' } });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.json();
}

// Only same-origin failures count. A blocked Google Fonts request says nothing
// about whether the build is sound, and failing on it would make this flaky in
// exactly the environments where it matters most.
function watchPage(page, origin, failures) {
  page.on('response', (r) => {
    if (r.status() >= 400 && r.url().startsWith(origin))
      failures.push(`HTTP ${r.status()} ${r.url()}`);
  });
  page.on('pageerror', (e) => failures.push(`page error: ${String(e).slice(0, 200)}`));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const served = args.dir ? await serve(args.dir) : null;
  const base = (served?.base ?? args.base).replace(/\/$/, '');
  const problems = [];

  console.log(`Smoke-testing the built Storybook at ${base}`);

  const index = await fetchJson(`${base}/index.json`);
  const stories = Object.values(index.entries ?? {}).filter((e) => e.type === 'story');
  if (stories.length === 0) throw new Error(`${base}/index.json lists no stories`);

  // Deterministic sample: sorted, evenly spread, with the anchor always in.
  const ids = stories.map((s) => s.id).sort();
  const step = Math.max(1, Math.floor(ids.length / args.sample));
  const sample = new Set(ids.filter((_, i) => i % step === 0).slice(0, args.sample));
  sample.add(ANCHOR.storyId);

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });

  try {
    for (const id of sample) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      const failures = [];
      watchPage(page, base, failures);

      await page.goto(`${base}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(700);

      const empty = await page.evaluate((tokens) => {
        const root = getComputedStyle(document.documentElement);
        return tokens.filter((t) => !root.getPropertyValue(t).trim());
      }, TOKENS);

      if (empty.length) {
        problems.push(
          `${id}: ${empty.length} design token(s) resolve to nothing on :root — ${empty.join(', ')}. ` +
            `theme.css is missing from the bundle; components will render unstyled.`,
        );
      }

      if (id === ANCHOR.storyId) {
        const anchor = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const s = getComputedStyle(el);
          return { bg: s.backgroundColor, radius: s.borderRadius, padding: s.padding };
        }, ANCHOR.selector);

        if (!anchor) {
          problems.push(`${id}: no ${ANCHOR.selector} element rendered`);
        } else if (anchor.bg === 'rgba(0, 0, 0, 0)' || anchor.bg === 'transparent') {
          problems.push(
            `${id}: the ${ANCHOR.describe} has a transparent background ` +
              `(radius ${anchor.radius}, padding ${anchor.padding}) — its styles did not apply.`,
          );
        } else {
          console.log(
            `  ${ANCHOR.describe}: background ${anchor.bg}, radius ${anchor.radius}, padding ${anchor.padding}`,
          );
        }
      }

      if (failures.length) problems.push(`${id}: ${failures.join('; ')}`);
      await page.close();
    }

    // The manager shell is served separately from the story iframe, so a broken
    // upload can leave one working and the other not.
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const failures = [];
    watchPage(page, base, failures);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const sidebar = await page.locator('#storybook-explorer-tree, .sidebar-container').count();
    if (sidebar === 0) problems.push('index.html: the sidebar did not render');
    if (failures.length) problems.push(`index.html: ${failures.join('; ')}`);
    await page.close();
  } finally {
    await browser.close();
    served?.close();
  }

  if (problems.length) {
    console.error(`\nSmoke test failed — ${problems.length} problem(s):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `\nSmoke test passed: ${sample.size} stories checked, tokens resolve, nothing failed to load.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
