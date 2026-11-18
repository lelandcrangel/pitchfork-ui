#!/usr/bin/env node
/*
 * Which element events may bubble, and which name may be used by whom.
 *
 * A bubbling event reaches every ancestor, and a listener for that name on an
 * ancestor cannot tell its own element's event from one that came up from
 * inside. Seven containers emitted `pfChange`, the name every form control
 * inside them also emits, so a `pf-switch` in a tab panel handed `pf-tabs`'
 * handler `{ value: "on" }`; and thirteen overlays emitted a bubbling
 * `pfOpenChange`, so a `pf-select` closing inside a `pf-modal` told the
 * modal's handler `{ open: false }` -- a consumer binding `open` to it closed
 * the dialog. Renaming one event never fixes this, because a container can
 * contain another of itself.
 *
 * So the rule follows the platform's own events:
 *   - `pfChange` and `pfInput` bubble, like `change` and `input`, and only a
 *     form-associated element may emit them. A form control has nothing
 *     inside it that could emit the same name.
 *   - An event another element listens for is a child-to-parent protocol
 *     (`pfTabSelect`, `pfOptionSelect`) and has to bubble to reach the parent.
 *   - Everything else is about the element it fires on, like `toggle` and
 *     `close`, and is declared `{ bubbles: false }`.
 *
 * Read from the component sources rather than from Stencil's docs.json, so
 * the answer is the same on a clean checkout before anything is built.
 *
 * Usage: node scripts/check-event-bubbling.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(root, 'packages/elements/src/components');
const FORM_EVENTS = new Set(['pfChange', 'pfInput']);

const components = fs
  .readdirSync(componentsDir)
  .map((tag) => ({ tag, file: path.join(componentsDir, tag, `${tag}.tsx`) }))
  .filter(({ file }) => fs.existsSync(file))
  .map(({ tag, file }) => {
    const source = fs.readFileSync(file, 'utf8');
    const events = [...source.matchAll(/@Event\(([^)]*)\)\s*(\w+)!?\s*:/g)].map((m) => ({
      name: m[2],
      bubbles: !/bubbles\s*:\s*false/.test(m[1]),
      line: source.slice(0, m.index).split('\n').length,
    }));
    const listens = [...source.matchAll(/@Listen\(\s*['"](\w+)['"]/g)].map((m) => m[1]);
    return { tag, file, events, listens, formAssociated: /formAssociated:\s*true/.test(source) };
  });

if (components.length === 0) throw new Error(`no components found under ${componentsDir}`);

const protocol = new Set(components.flatMap((c) => c.listens));
const problems = [];
let total = 0;
let bubbling = 0;

for (const { tag, file, events, formAssociated } of components) {
  for (const event of events) {
    total += 1;
    const where = `${path.relative(root, file)}:${event.line}  ${tag} ${event.name}`;
    if (FORM_EVENTS.has(event.name)) {
      if (!formAssociated) {
        problems.push(
          `${where} -- only a form control emits ${event.name}; anything inside this element ` +
            'that is one emits the same name. Give it a name of its own.',
        );
      } else if (!event.bubbles) {
        problems.push(
          `${where} -- a form control's ${event.name} bubbles, as the native event does.`,
        );
      }
      continue;
    }
    if (protocol.has(event.name)) {
      bubbling += 1;
      continue;
    }
    if (event.bubbles) {
      problems.push(
        `${where} -- bubbles into any ancestor of the same kind; declare it @Event({ bubbles: false }).`,
      );
    }
  }
}

if (problems.length > 0) {
  console.error(
    `${problems.length} element event${problems.length === 1 ? '' : 's'} can reach a listener ` +
      `that is not ${problems.length === 1 ? 'its' : 'theirs'}:\n` +
      problems.map((p) => `  ${p}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `check-event-bubbling: ${total} events across ${components.length} elements; ` +
    `${bubbling} child-to-parent events bubble, and pfChange/pfInput come only from form controls.`,
);
