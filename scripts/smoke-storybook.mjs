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
//
// The id is unchanged by the React components leaving -- `pf-button`'s page is
// `Components/Button` now, so it answers to the same slug. What changed is
// where the painted box is: the React component put `.pf-button` in the
// document, and the element paints a `<button>` inside its shadow root, which
// no document-level selector can reach. Hence `shadow`.
const ANCHOR = {
  storyId: 'components-button--interactive',
  selector: 'pf-button',
  shadow: 'button',
  describe: 'primary pf-button',
};

// One docs page as well as the stories, because the two are compiled by
// different pipelines and only one of them was ever checked.
//
// The 108 generated element reference pages are almost entirely GFM tables,
// and Storybook's MDX pipeline runs remark with no GFM extension unless
// `remark-gfm` is wired into addon-docs' `mdxCompileOptions`. Without it a
// pipe table is a paragraph of pipe characters: no error, no failed request,
// every story still fine, and the entire web-components reference unreadable.
// Measured both ways by removing the plugin and rebuilding — the page's
// `<table>` count goes to zero and the header row turns up as literal text.
//
// So this asserts both halves: a table is there, and the raw row is not.
//
// It also asserts the thing those pages are now for. Each one carries a live
// element, which needs `defineCustomElements()` to have run in `preview.ts`
// and the lazy chunks to have resolved through the bundler. Nothing in a build
// says whether that happened: an unregistered `<pf-alert>` is a perfectly
// valid unknown element, so the markup, the tables and the page all look
// right and the box is simply empty.
//
// The signal is Stencil's own `hydrated` class, not a non-empty shadow root.
// `pf-menu-separator` and `pf-toolbar-separator` render `<Host>` with no
// children at all — the host *is* the rule, styled through `:host` — so they
// hydrate correctly with an empty shadow root, and the first version of this
// check called all three of them broken.
const DOCS_ANCHOR = {
  storyId: 'components-alert--docs',
  describe: 'the <pf-alert> reference page',
  rawRow: '| Property | Attribute |',
};

// A few more reference pages beyond the anchor, sampled the same deterministic
// way the stories are: registration is global, so the anchor alone proves it,
// but one element's own example can still be broken on its own page.
const DOCS_SAMPLE = 5;

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

  // A flag whose value is missing -- last on the line, or an empty shell
  // expansion -- used to read as undefined and fall through to the local
  // default below, so `--base "$SITE"` with SITE unset smoke-tested local files
  // and called the live site healthy. An unknown flag did the same. Both are
  // errors now: this script may not quietly check something other than what it
  // was asked to check.
  const value = (flag, i) => {
    const v = argv[i];
    if (v === undefined || v === '' || v.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    return v;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dir') args.dir = value('--dir', (i += 1));
    else if (arg === '--base') args.base = value('--base', (i += 1));
    else if (arg === '--sample') args.sample = Number(value('--sample', (i += 1)));
    else throw new Error(`Unknown argument: ${arg}`);
  }
  // Alternative targets, not composable. Passing both used to serve the
  // directory and silently drop --base, so a deploy job asking for the live
  // site would have tested local files and reported the site healthy. That is
  // the failure this script exists to make impossible, so it is an error.
  if (args.dir && args.base) {
    throw new Error('--dir and --base are alternative targets; pass one, not both.');
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

// node's fetch has no default timeout. Against the live site, a server that
// accepts the connection and then stalls would hang here forever -- before the
// browser timeouts or any cleanup could run -- leaving the deploy job stuck
// rather than failing. Matches the 30s the freshness check already uses.
const FETCH_TIMEOUT_MS = Number(process.env.SMOKE_FETCH_TIMEOUT_MS ?? 30_000);

async function fetchJson(url) {
  let response;
  try {
    response = await fetch(url, {
      headers: { 'cache-control': 'no-cache' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    const reason =
      error?.name === 'TimeoutError' ? `no response within ${FETCH_TIMEOUT_MS}ms` : error?.message;
    throw new Error(`GET ${url} failed: ${reason}`, { cause: error });
  }
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
// it.
//
// Readiness is Storybook's own settled state, not a guess from the DOM. An
// earlier version waited for #storybook-root to have children, which asks the
// wrong question: it describes the shape of the DOM rather than whether
// Storybook thinks it succeeded. Against a story the bundle cannot render that
// version did fail -- both failure screens leave the root empty, so it never
// reported a clean pass -- but it blamed a 20s timeout instead of naming the
// error. Reading the state gives the real reason, and gives it per story:
// before this, only the Button anchor carried a story-specific assertion, so
// the rest were checked for little beyond the global tokens.
//
// Storybook sets exactly one of these on the body, so waiting for any of them
// and then reading which one is both a readiness signal and a result.
async function openStory(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const c = document.body.classList;
      // sb-show-main flips before React has necessarily put the story in the
      // DOM, so on the success path the root must also have content. The two
      // failure screens leave the root empty by design, so they settle on the
      // class alone -- requiring children there would turn a detected error
      // into a timeout with a worse message.
      const rendered =
        c.contains('sb-show-main') &&
        (document.querySelector('#storybook-root')?.children.length ?? 0) > 0;
      const failed = c.contains('sb-show-errordisplay') || c.contains('sb-show-nopreview');
      return (rendered || failed) && document.styleSheets.length > 0;
    },
    undefined,
    { timeout: 20000 },
  );
  return page.evaluate(() => {
    const c = document.body.classList;
    if (c.contains('sb-show-errordisplay')) {
      const message = document.querySelector('#error-message')?.textContent?.trim();
      return { ok: false, reason: `Storybook render error -- ${message || 'no message given'}` };
    }
    if (c.contains('sb-show-nopreview')) {
      return { ok: false, reason: 'Storybook showed its "no preview" screen' };
    }
    return { ok: true };
  });
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
  // Declared at this scope, not inside the try block: the summary line below
  // is printed after the browser's `finally` and cannot see a binding made
  // inside it.
  const docsSample = new Set();

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

  /*
   * `PW_CHROMIUM_PATH` is the name the other three Playwright entry points
   * use and the only one CLAUDE.md documents. This script read
   * `PLAYWRIGHT_CHROMIUM_PATH` alone, so in an environment whose Chromium
   * does not match Playwright's pinned build, setting the documented
   * variable got three suites passing and left this one failing with
   * Playwright's own "run npx playwright install" banner — which points at
   * the wrong cause entirely. The old name is still honoured in case
   * anything sets it.
   */
  const browser = await chromium.launch({
    executablePath:
      process.env.PW_CHROMIUM_PATH || process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
  });

  try {
    for (const id of sample) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
      const failures = [];
      watchPage(page, origin, failures);

      let state;
      try {
        state = await openStory(page, `${base}/iframe.html?id=${id}&viewMode=story`);
      } catch {
        problems.push(`${id}: Storybook never reached a settled state within 20s`);
        if (failures.length) problems.push(`${id}: ${failures.join('; ')}`);
        await page.close();
        continue;
      }

      if (!state.ok) {
        problems.push(`${id}: ${state.reason}`);
        if (failures.length) problems.push(`${id}: ${failures.join('; ')}`);
        await page.close();
        continue;
      }

      // Any sampled story may now be an element's Interactive story, and a
      // story rendering a dead custom element looks the same as one rendering
      // nothing: valid HTML, no error. The docs-page check below samples six
      // reference pages; this covers whichever stories the sample lands on.
      const dead = await page.evaluate(async () => {
        const root = document.querySelector('#storybook-root');
        if (!root) return [];
        const deadline = Date.now() + 8000;
        let hosts = [];
        while (Date.now() < deadline) {
          hosts = [...root.querySelectorAll('*')].filter((n) => n.tagName.startsWith('PF-'));
          if (hosts.length === 0) break;
          if (hosts.every((h) => h.classList.contains('hydrated'))) break;
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        return [
          ...new Set(
            hosts
              .filter((h) => !h.classList.contains('hydrated'))
              .map((h) => h.tagName.toLowerCase()),
          ),
        ];
      });

      if (dead.length) {
        problems.push(
          `${id}: ${dead.join(', ')} rendered but never hydrated — the elements are not registered.`,
        );
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
        const anchor = await page.evaluate(({ selector, shadow }) => {
          const host = document.querySelector(selector);
          if (!host) return null;
          // The element's own box is a plain inline-flex wrapper; the painted
          // surface is the button in its shadow root, so reading the host
          // would report a transparent background on a perfectly good build.
          const painted = shadow ? host.shadowRoot?.querySelector(shadow) : host;
          if (!painted) return null;
          const s = getComputedStyle(painted);
          return { bg: s.backgroundColor, radius: s.borderRadius, padding: s.padding };
        }, ANCHOR);

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

    // Docs pages settle differently from a story: MDX renders into Storybook's
    // own docs wrapper rather than into #storybook-root, so openStory's
    // readiness condition never holds and the sb-show-* classes are not the
    // signal here.
    const docsIds = Object.values(index.entries ?? {})
      // Every reference page is under `Components` now that the elements own
      // that section; the Foundations pages are hand-written prose and carry
      // no element, so they are not what this samples.
      .filter((e) => e.type === 'docs' && e.id.startsWith('components-'))
      .map((e) => e.id)
      .sort();
    for (const id of Array.from(
      { length: Math.min(DOCS_SAMPLE, docsIds.length) },
      (_, i) => docsIds[Math.round((i * (docsIds.length - 1)) / Math.max(1, DOCS_SAMPLE - 1))],
    )) {
      docsSample.add(id);
    }
    docsSample.add(DOCS_ANCHOR.storyId);

    for (const id of docsSample) {
      const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
      const failures = [];
      watchPage(page, origin, failures);
      try {
        await page.goto(`${base}/iframe.html?id=${id}&viewMode=docs`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForFunction(
          () => (document.querySelector('.sbdocs-content')?.children.length ?? 0) > 0,
          undefined,
          { timeout: 20000 },
        );
        const docs = await page.evaluate(async (raw) => {
          const content = document.querySelector('.sbdocs-content');
          // The elements load lazily, so the shadow root exists a frame or
          // more before anything is in it. Poll rather than pick a sleep —
          // the same reason the element package's own tests do.
          const deadline = Date.now() + 10000;
          let hosts = [];
          while (Date.now() < deadline) {
            hosts = [...content.querySelectorAll('*')].filter((n) => n.tagName.startsWith('PF-'));
            if (hosts.length > 0 && hosts.every((h) => h.classList.contains('hydrated'))) break;
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          // Nothing in a preview may be laid out outside its own box. The
          // check exists because six examples set `open` on an element that
          // is a native <dialog> opened with showModal(): that promotes the
          // panel to the top layer, so it covered the whole page rather than
          // sitting in the preview. Measured before the fix —
          // `pf-modal::dialog` at 0,0 1024x900 with the stage collapsed to
          // 40px tall — and `pf-alert` on the same build escaped nothing,
          // which is what makes this a real check rather than a tautology.
          //
          // The visible panel of a dialog-based element is inside its shadow
          // root, so the host's own box would say nothing. A zero-sized box
          // is skipped: a closed dialog has one, and so does
          // `pf-visually-hidden`, which is clipped by design.
          const stage = content.querySelector('[style*="border"] > div');
          const bounds = stage?.getBoundingClientRect();
          const escaped = [];
          for (const host of hosts) {
            const panel = host.shadowRoot?.querySelector('dialog');
            const box = (panel ?? host).getBoundingClientRect();
            if (!bounds || box.width === 0 || box.height === 0) continue;
            if (
              box.top < bounds.top - 4 ||
              box.bottom > bounds.bottom + 4 ||
              box.left < bounds.left - 4 ||
              box.right > bounds.right + 4
            ) {
              escaped.push(
                `${host.tagName.toLowerCase()}${panel ? '::dialog' : ''} ` +
                  `${Math.round(box.width)}x${Math.round(box.height)}`,
              );
            }
          }

          return {
            tables: content.querySelectorAll('table').length,
            raw: (content.textContent ?? '').includes(raw),
            hosts: hosts.length,
            hydrated: hosts.filter((h) => h.classList.contains('hydrated') && h.shadowRoot).length,
            escaped: [...new Set(escaped)],
            unhydrated: [
              ...new Set(
                hosts
                  .filter((h) => !h.classList.contains('hydrated') || !h.shadowRoot)
                  .map((h) => h.tagName.toLowerCase()),
              ),
            ],
          };
        }, DOCS_ANCHOR.rawRow);

        if (docs.hosts === 0) {
          problems.push(
            `${id}: no <pf-*> element on the page at all — the generated example is missing.`,
          );
        } else if (docs.unhydrated.length > 0) {
          problems.push(
            `${id}: ${docs.unhydrated.join(', ')} never hydrated. The elements are not ` +
              `registered: preview.ts has to call defineCustomElements() from ` +
              `@pitchfork-ui/elements/loader, and @pitchfork-ui/elements has to be built.`,
          );
        } else if (docs.escaped.length > 0) {
          problems.push(
            `${id}: ${docs.escaped.join(', ')} is laid out outside the preview box. ` +
              `An example that sets \`open\` on a showModal() element covers the whole ` +
              `page — show it closed, with a trigger.`,
          );
        }

        // Only the anchor is checked for tables: pf-menu-separator has no
        // props, events, methods, slots or parts, so its page has none, and a
        // sampled page could be that one.
        if (id === DOCS_ANCHOR.storyId) {
          if (docs.tables === 0) {
            problems.push(
              `${id}: ${DOCS_ANCHOR.describe} rendered no <table> at all` +
                (docs.raw ? `, and its header row is on the page as literal text` : '') +
                `. remark-gfm is missing from addon-docs' mdxCompileOptions.`,
            );
          } else if (docs.raw) {
            problems.push(
              `${id}: ${DOCS_ANCHOR.describe} has ${docs.tables} table(s) ` +
                `but "${DOCS_ANCHOR.rawRow}" is still on the page as text.`,
            );
          } else {
            // `hydrated`, not `hosts`: an unregistered `<pf-alert>` is still an
            // element on the page, so counting hosts here would report "live"
            // for exactly the build this check exists to catch.
            console.log(
              `  ${DOCS_ANCHOR.describe}: ${docs.tables} tables, ` +
                `${docs.hydrated} of ${docs.hosts} element(s) hydrated`,
            );
          }
        }
      } catch {
        problems.push(`${id}: the docs page did not render within 20s`);
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
      // Not a story, so none of the sb-show-* classes apply here; the sidebar
      // rendering is the equivalent signal.
      await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
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
    `\nSmoke test passed: ${sample.size} stories and ${docsSample.size} element reference ` +
      `pages checked, tokens resolve, elements hydrate, nothing failed to load.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
