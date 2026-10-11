/**
 * What moving one React component to its element costs, derived rather than
 * written down.
 *
 * Both the migration guide and the codemod read this, for the reason every
 * shared thing in this repo lives in one place: a guide that says a prop is a
 * drop-in while the codemod refuses it is worse than either alone, and nothing
 * would report the disagreement.
 *
 * The judgement is a question per prop, answered from the two metadata
 * artifacts and never from a list.
 *
 * A `ReactNode` prop has **three** possible fates, not two, and this is the
 * part a hand-written table cannot express:
 *
 *   - the element declares a **slot** of that name, so the markup becomes a
 *     slotted child (`pf-metric-card` has `heading`);
 *   - the element declares a **string prop** of that name, so plain text moves
 *     across untouched and only *markup* has to be rethought (`pf-alert.heading`
 *     is `string | undefined`, and `REACT-RETIREMENT-PLAN.md` lists it as a
 *     slot, which it is not);
 *   - neither, which is a gap to report rather than a rewrite to attempt.
 *
 * An array prop has two:
 *
 *   - the element still has a prop of that name, so it stays a property and the
 *     call site does not change shape;
 *   - it does not, so the element takes child elements for it
 *     (WEB-COMPONENTS-PLAN.md 2.1) and the consumer's loop inverts.
 *
 * That second pair is the one the plan's table misses for the charts: it lists
 * `data, series` together as "becomes children", while a chart's `data` really
 * does stay a property -- the rows are bulk numbers with no identity, where the
 * series have names and colours and so are nested. Deriving all of it from
 * `elements.json` gets these right for the same reason the reference pages are
 * generated: the element's own recorded API is the only thing that cannot drift
 * from the element.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const REACT_METADATA = join(ROOT, 'packages', 'react', 'dist', 'metadata.json');
export const ELEMENTS_METADATA = join(ROOT, 'packages', 'mcp', 'data', 'elements.json');

/** A `ReactNode` prop, however it is spelled in the source. */
const isNode = (type) => /\bReact\.ReactNode\b|\bReactNode\b/.test(type);

/**
 * An array type. `string[] | string` counts, which is why the alternation
 * includes a `[]` followed by a union bar -- `NumberInput.locale` is spelled
 * that way and is still bulk data.
 */
const isArray = (type) => /\[\]\s*$|^Array<|\[\]\s*\|/.test(type.trim());

/** `onChange` -> `onPfChange`, which is what the generated bindings expose. */
export const eventPropName = (name) => `onPf${name.slice(2)}`;

const isEventProp = (prop) => /^on[A-Z]/.test(prop.name);

export function loadMigrationMap({
  reactMetadataPath = REACT_METADATA,
  elementsMetadataPath = ELEMENTS_METADATA,
} = {}) {
  const react = JSON.parse(readFileSync(reactMetadataPath, 'utf8'));
  const elements = JSON.parse(readFileSync(elementsMetadataPath, 'utf8'));
  const byTag = new Map(elements.elements.map((element) => [element.tag, element]));

  const components = react.components.map((component) => {
    const coverage = elements.reactCoverage[component.name];
    const element = coverage?.tag ? byTag.get(coverage.tag) : undefined;

    // A slot's `name` is null for the default slot, which `children` already
    // covers, so only the named ones are a destination for a prop.
    const elementProps = new Map((element?.props ?? []).map((prop) => [prop.name, prop]));
    const elementSlots = new Set(
      (element?.slots ?? []).map((slot) => slot.name).filter((name) => Boolean(name)),
    );

    const becomesSlot = [];
    const staysTextProp = [];
    const unmapped = [];
    const becomesChildren = [];
    const staysProperty = [];
    const events = [];

    for (const prop of component.props ?? []) {
      // `children` maps to the default slot untouched, so it is never work.
      if (prop.name === 'children') continue;

      if (isEventProp(prop)) {
        events.push({ from: prop.name, to: eventPropName(prop.name) });
        continue;
      }

      if (isNode(prop.type)) {
        if (elementSlots.has(prop.name)) becomesSlot.push(prop.name);
        else if (elementProps.has(prop.name)) staysTextProp.push(prop.name);
        else unmapped.push(prop.name);
        continue;
      }

      if (isArray(prop.type)) {
        if (elementProps.has(prop.name)) staysProperty.push(prop.name);
        else becomesChildren.push(prop.name);
      }
    }

    // A text prop is not a reshape: `heading="Saved"` moves across as it
    // stands. It is only work when the value is markup, which is a judgement
    // about the *call site*, not about the component -- so the codemod warns at
    // the call site and the component still counts as a drop-in here.
    const reshaped = becomesSlot.length > 0 || becomesChildren.length > 0 || unmapped.length > 0;

    return {
      name: component.name,
      category: component.category,
      tag: coverage?.tag ?? null,
      binding: coverage?.tag ? `Pf${pascal(coverage.tag)}` : null,
      // Printed next to an unmapped prop, because several of them really do
      // belong in the element's *default* slot -- `pf-page-header`'s default
      // slot is the title, so `PageHeader.heading` goes there -- and which prop
      // that is cannot be derived from a name. Showing the destinations lets a
      // reader choose instead of guessing.
      elementSlots: (element?.slots ?? []).map((slot) => slot.name ?? '(default)'),
      // An element absorbed this component rather than mirroring it, so there
      // is no binding of its own to rename to; `how` says what to do instead.
      absorbed: coverage?.absorbed === true,
      how: coverage?.how ?? null,
      dropIn: !reshaped,
      becomesSlot,
      staysTextProp,
      unmapped,
      becomesChildren,
      staysProperty,
      events,
    };
  });

  return {
    reactVersion: react.version,
    elementsVersion: elements.version,
    components: components.sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/** `pf-line-chart` -> `LineChart`, which is how the output targets name it. */
function pascal(tag) {
  return tag
    .replace(/^pf-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/** The counts the guide prints and the plan quotes. */
export function summarise(map) {
  const contentOnly = map.components.filter(
    (c) => c.becomesSlot.length > 0 && c.becomesChildren.length === 0,
  );
  const dataOnly = map.components.filter(
    (c) => c.becomesChildren.length > 0 && c.becomesSlot.length === 0,
  );
  const both = map.components.filter(
    (c) => c.becomesSlot.length > 0 && c.becomesChildren.length > 0,
  );
  return {
    total: map.components.length,
    dropIn: map.components.filter((c) => c.dropIn).length,
    contentOnly: contentOnly.length,
    dataOnly: dataOnly.length,
    both: both.length,
    withSlots: contentOnly.length + both.length,
    withChildren: dataOnly.length + both.length,
    absorbed: map.components.filter((c) => c.absorbed).length,
    // A `ReactNode` prop the element answers with a plain string: the call site
    // is fine unless it passes markup.
    withTextProps: map.components.filter((c) => c.staysTextProp.length > 0).length,
    unmapped: map.components.filter((c) => c.unmapped.length > 0).length,
  };
}
