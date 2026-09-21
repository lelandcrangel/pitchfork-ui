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
//
// Filtering on the origin rather than the base path is deliberate. In deploy
// mode the base is https://host/pitchfork-ui, and a build that lost its base
// path requests its assets from the domain root instead -- same origin, outside
// the base path. That is a broken deploy, and matching on the path would let it
// through silently.
//
// A request that fails at the network layer never produces a response event, so
// it needs watching separately or a dead asset host looks like a clean run.
function watchPage(page, origin, failures) {
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === origin) {
      failures.push(`HTTP ${r.status()} ${r.url()}`);
    }
  });
  page.on('requestfailed', (r) => {
    if (new URL(r.url()).origin === origin) {
      failures.push(`request failed (${r.failure()?.errorText ?? 'unknown'}) ${r.url()}`);
    }
  });
  page.on('pageerror', (e) => failures.push(`page error: ${String(e).slice(0, 200)}`));
}

// domcontentloaded plus an explicit readiness condition, never networkidle.
// networkidle waits for *every* request to settle, including the third-party
// ones this script deliberately ignores for pass/fail -- so a slow or hanging
// Google Fonts request could time out a navigation that has nothing wrong with
// it. Waiting on the two things that actually matter is both faster and honest:
// the story has rendered, and stylesheets have been applied. Neither presumes
// the tokens resolve, which is the thing under test.
async function openAndSettle(page, url, rootSelector) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    (sel) => {
      const root = document.querySelector(sel);
      return Boolean(root && root.children.length > 0) && document.styleSheets.length > 0;
    },
    rootSelector,
    { timeout: 20000 },
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const served = args.dir ? await serve(args.dir) : null;
  try {
    return await run(args, served);
  } finally {
    // Everything from here used to sit outside a cleanup path: a missing
    // index.json, an empty story list or a Chromium that would not launch left
    // the server listening, which keeps node alive. The process then hung until
    // the job timed out instead of failing in a second with a reason.
    served?.close();
  }
}

async function run(args, served) {
  const base = (served?.base ?? args.base).replace(/\/$/, '');
  const origin = new URL(base).origin;
  const problems = [];

  console.log(`Smoke-testing the built Storybook at ${base}`);

  const index = await fetchJson(`${base}/index.json`);
  const stories = Object.values(index.entries ?? {}).filter((e) => e.type === 'story');
  if (stories.length === 0) throw new Error(`${base}/index.json lists no stories`);

  // Deterministic sample: sorted, evenly spread including both endpoints, with
  // the anchor always in.
  //
  // Computing the indices directly rather than taking every Nth id and slicing.
  // That older form did not do what its comment claimed: with 396 stories and a
  // sample of 6 it stopped at index 330, leaving the last 65 stories never
  // looked at, and whenever the story count fell below twice the sample the
  // step collapsed to 1 and it degenerated to "the first N". A regression
  // confined to either end of the sorted list would have gone unseen.
  const ids = stories.map((s) => s.id).sort();
  const count = Math.min(args.sample, ids.length);
  const sample = new Set(
    count === 1
      ? [ids[0]]
      : Array.from(
          { length: count },
          (_, i) => ids[Math.round((i * (ids.length - 1)) / (count - 1))],
        ),
  );
  sample.add(ANCHOR.storyId);

  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });

  try {
    for (const id of sample) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      const failures = [];
      watchPage(page, origin, failures);

      try {
        await openAndSettle(page, `${base}/iframe.html?id=${id}&viewMode=story`, '#storybook-root');
      } catch {
        problems.push(`${id}: the story did not render within 20s`);
        if (failures.length) problems.push(`${id}: ${failures.join('; ')}`);
        await page.close();
        continue;
      }

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
    watchPage(page, origin, failures);
    try {
      await openAndSettle(page, `${base}/index.html`, 'body');
      await page.waitForSelector('#storybook-explorer-tree, .sidebar-container', {
        timeout: 20000,
      });
    } catch {
      problems.push('index.html: the sidebar did not render within 20s');
    }
    if (failures.length) problems.push(`index.html: ${failures.join('; ')}`);
    await page.close();
  } finally {
    await browser.close();
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
