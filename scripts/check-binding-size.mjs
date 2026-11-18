#!/usr/bin/env node
/*
 * What one element costs through each framework binding, against what it
 * costs imported on its own.
 *
 * Each binding imports all 108 element modules from one file, and a bundler
 * may only drop the 107 an app does not use if importing them does nothing.
 * Until 0.4 every element module registered itself on import
 * (`customElementsExportBehavior: 'auto-define-custom-elements'`), so none of
 * them could be dropped: an Angular app using one `PfBadge` shipped
 * 146.7 KB gzipped where the badge alone is 44.4 KB, and Vue was no
 * better. Nothing else in the repository measures a consumer's bundle, so
 * nothing noticed.
 *
 * Each case is a one-element app built by the tool a consumer of that
 * framework actually uses: Vite for React and Vue, the Angular CLI for
 * Angular (its optimizer is what makes the decorated proxies droppable, so
 * a plain bundler would measure the wrong thing). The framework itself is
 * external for Vite and subtracted for Angular, so the number is the
 * library's own cost.
 *
 * Needs `npm run build:elements` first.
 *
 * Usage: node scripts/check-binding-size.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/*
 * How far a binding may sit above the element on its own. The real overhead
 * is the wrapper runtime -- @lit/react, Vue's defineContainer, Angular's
 * proxy -- which measured 1-3 KB. A binding that pulls in its siblings again
 * lands about 100 KB over, so the margin is generous without being able to
 * hide that.
 */
const MAX_OVERHEAD_KB = 10;

/*
 * And a ceiling on the element itself, which the comparison above cannot see:
 * anything added to the shared runtime lands on both sides of it. The 42.5 KB
 * token sheet was compiled into that runtime and attached to every shadow
 * root, taking a badge from 7.4 KB to 13.2 KB gzipped. The stylesheet reaches
 * the page as `styles.css`, which a consumer already loads.
 */
const MAX_ELEMENT_KB = 10;

const kb = (bytes) => (bytes / 1024).toFixed(1);
const gzipped = (code) => gzipSync(code, { level: 9 }).length;

/** Builds one entry with Vite, the framework external, and returns its gzipped size. */
async function viteSize(name, source, external) {
  const dir = fs.mkdtempSync(path.join(root, 'node_modules', '.binding-size-'));
  try {
    fs.writeFileSync(path.join(dir, 'entry.js'), source);
    const output = await build({
      root: dir,
      configFile: false,
      logLevel: 'silent',
      build: {
        write: false,
        minify: true,
        rollupOptions: {
          input: path.join(dir, 'entry.js'),
          external,
          // Keep everything in one chunk so the measure is one file.
          output: { codeSplitting: false },
        },
      },
    });
    const chunks = [output].flat().flatMap((o) => o.output);
    return chunks.filter((c) => c.type === 'chunk').reduce((sum, c) => sum + gzipped(c.code), 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/*
 * The Angular CLI resolves packages from the project it builds, so the probe
 * app lives inside the Angular consumer for the length of the build. It has a
 * package.json of its own because the CLI otherwise walks up to the
 * consumer's angular.json and builds that instead.
 */
function angularSize(main) {
  const app = path.join(root, 'apps/consumer-angular');
  const dir = fs.mkdtempSync(path.join(app, 'binding-size-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'package.json'), '{ "private": true, "type": "module" }\n');
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><app-root></app-root>\n');
    fs.writeFileSync(
      path.join(dir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'preserve',
          moduleResolution: 'bundler',
          lib: ['DOM', 'ES2022'],
          strict: true,
          skipLibCheck: true,
          experimentalDecorators: true,
          useDefineForClassFields: false,
        },
        files: ['src/main.ts'],
      }),
    );
    fs.writeFileSync(
      path.join(dir, 'angular.json'),
      JSON.stringify({
        version: 1,
        projects: {
          probe: {
            projectType: 'application',
            root: '',
            sourceRoot: 'src',
            architect: {
              build: {
                builder: '@angular/build:application',
                options: {
                  outputPath: { base: 'dist', browser: '' },
                  index: 'index.html',
                  browser: 'src/main.ts',
                  tsConfig: 'tsconfig.json',
                  polyfills: [],
                  optimization: true,
                  outputHashing: 'none',
                },
              },
            },
          },
        },
      }),
    );
    fs.writeFileSync(path.join(dir, 'src/main.ts'), main);
    execFileSync(path.join(root, 'node_modules/.bin/ng'), ['build'], {
      cwd: dir,
      stdio: 'pipe',
      env: { ...process.env, NG_CLI_ANALYTICS: 'false' },
    });
    const out = path.join(dir, 'dist');
    return fs
      .readdirSync(out)
      .filter((f) => f.endsWith('.js'))
      .reduce((sum, f) => sum + gzipped(fs.readFileSync(path.join(out, f))), 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const angularApp = (imports, extra, template) => `
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
${extra}
@Component({ selector: 'app-root', imports: [${imports}], schemas: [CUSTOM_ELEMENTS_SCHEMA], template: '${template}' })
class App {}
void bootstrapApplication(App);
`;

const direct = await viteSize(
  'direct',
  `import { defineCustomElement } from '@pitchfork-ui/elements/components/pf-badge.js';
defineCustomElement();`,
  [],
);

const results = [
  {
    name: '@pitchfork-ui/elements-react',
    size: await viteSize(
      'react',
      `import { PfBadge } from '@pitchfork-ui/elements-react';
console.log(PfBadge);`,
      [/^react($|\/)/, /^react-dom($|\/)/],
    ),
  },
  {
    name: '@pitchfork-ui/elements-vue',
    size: await viteSize(
      'vue',
      `import { PfBadge } from '@pitchfork-ui/elements-vue';
console.log(PfBadge);`,
      [/^vue($|\/)/],
    ),
  },
];

const angularBaseline = angularSize(angularApp('', '', 'hi'));
results.push({
  name: '@pitchfork-ui/elements-angular',
  size:
    angularSize(
      angularApp(
        'PfBadge',
        "import { PfBadge } from '@pitchfork-ui/elements-angular';",
        '<pf-badge>hi</pf-badge>',
      ),
    ) - angularBaseline,
});

console.log(`pf-badge on its own: ${kb(direct)} KB gzipped`);
const problems = [];
if (direct / 1024 > MAX_ELEMENT_KB) {
  console.error(
    `\npf-badge alone is ${kb(direct)} KB, over the ${MAX_ELEMENT_KB} KB ceiling. The shared ` +
      'runtime has grown: check that addGlobalStyleToComponents is still false in ' +
      'packages/elements/stencil.config.ts, so the token sheet is not compiled into every element.',
  );
  process.exitCode = 1;
}
for (const { name, size } of results) {
  const over = (size - direct) / 1024;
  console.log(`  through ${name}: ${kb(size)} KB (${over >= 0 ? '+' : ''}${over.toFixed(1)} KB)`);
  if (over > MAX_OVERHEAD_KB) problems.push(name);
}

if (problems.length > 0) {
  console.error(
    `\n${problems.join(', ')} ship${problems.length === 1 ? 's' : ''} more than ${MAX_OVERHEAD_KB} KB ` +
      'beyond the one element used. A binding importing all the elements is only shakable while ' +
      'importing an element module does nothing: check customElementsExportBehavior and the ' +
      '"sideEffects" fields of @pitchfork-ui/elements and the binding.',
  );
  process.exit(1);
}
