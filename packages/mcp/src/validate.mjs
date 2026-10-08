/**
 * Usage validation.
 *
 * The point of difference: most component-library MCP servers only read. This
 * checks a snippet against the real API and says what is wrong.
 *
 * Every check here is chosen to have effectively no false positives, because a
 * validator that cries wolf gets ignored. For an attribute that is not a
 * declared prop:
 *
 *   - `data-*`, `aria-*`, `on*` handlers and DOM attributes pass, since nearly
 *     every component spreads onto a native element.
 *   - anything else is reported as invented, with a suggestion when it is close
 *     to a real prop and the component's prop list when it is not.
 *   - components whose props cannot be fully enumerated (`propsComplete: false`)
 *     are skipped, because an unlisted prop there proves nothing.
 *
 * The limitation that remains: a valid DOM attribute meaningless on a given
 * component is not flagged, since rejecting it would reject legitimate
 * passthrough props everywhere else.
 */

/** Levenshtein distance, capped — we only care about "is this within 2?". */
function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

const closest = (name, candidates) => {
  let best = null;
  let bestDistance = 3;
  for (const candidate of candidates) {
    const d = distance(name.toLowerCase(), candidate.toLowerCase());
    if (d < bestDistance) {
      best = candidate;
      bestDistance = d;
    }
  }
  return best;
};

/**
 * Attributes React forwards to a DOM element. Components here spread onto a
 * native element, so any of these is legitimate on any of them — but a prop
 * that is neither a declared prop nor one of these is invented, which is the
 * most common failure in un-grounded output (`padding`, `severity`, `tone`).
 *
 * Erring towards a longer list: a miss is cheaper than a false positive.
 */
const HTML_ATTRIBUTES = new Set([
  'about',
  'accept',
  'acceptCharset',
  'accessKey',
  'action',
  'allow',
  'allowFullScreen',
  'alt',
  'autoSave',
  'color',
  'datatype',
  'defaultChecked',
  'defaultValue',
  'enterKeyHint',
  'inert',
  'is',
  'itemID',
  'itemProp',
  'itemRef',
  'itemScope',
  'itemType',
  'nonce',
  'popover',
  'popoverTarget',
  'prefix',
  'property',
  'resource',
  'suppressHydrationWarning',
  'typeof',
  'unselectable',
  'vocab',
  'async',
  'autoCapitalize',
  'autoComplete',
  'autoFocus',
  'autoPlay',
  'capture',
  'cellPadding',
  'cellSpacing',
  'charSet',
  'checked',
  'children',
  'cite',
  'className',
  'colSpan',
  'cols',
  'content',
  'contentEditable',
  'controls',
  'coords',
  'crossOrigin',
  'dateTime',
  'default',
  'defer',
  'dir',
  'disabled',
  'download',
  'draggable',
  'encType',
  'form',
  'formAction',
  'headers',
  'height',
  'hidden',
  'href',
  'hrefLang',
  'htmlFor',
  'httpEquiv',
  'id',
  'inputMode',
  'integrity',
  'key',
  'kind',
  'label',
  'lang',
  'list',
  'loading',
  'loop',
  'max',
  'maxLength',
  'media',
  'method',
  'min',
  'minLength',
  'multiple',
  'muted',
  'name',
  'noValidate',
  'open',
  'pattern',
  'placeholder',
  'playsInline',
  'poster',
  'preload',
  'readOnly',
  'ref',
  'referrerPolicy',
  'rel',
  'required',
  'reversed',
  'role',
  'rowSpan',
  'rows',
  'sandbox',
  'scope',
  'selected',
  'shape',
  'size',
  'sizes',
  'slot',
  'span',
  'spellCheck',
  'src',
  'srcDoc',
  'srcLang',
  'srcSet',
  'start',
  'step',
  'style',
  'summary',
  'tabIndex',
  'target',
  'title',
  'translate',
  'type',
  'useMap',
  'value',
  'width',
  'wrap',
]);

const isPassthrough = (name) =>
  HTML_ATTRIBUTES.has(name) ||
  name.startsWith('data-') ||
  name.startsWith('aria-') ||
  /^on[A-Z]/.test(name);

/**
 * Pull `<Component ...>` occurrences out of a snippet. Deliberately a scanner
 * rather than a parser: the input is usually a fragment, not a valid module,
 * so a real parser would reject perfectly reasonable input.
 */
function scanTags(code, pattern) {
  const usages = [];
  const tag = new RegExp(pattern, 'g');
  let match;

  while ((match = tag.exec(code)) !== null) {
    let cursor = tag.lastIndex;
    let depth = 0;
    let quote = null;

    // Walk to the '>' that closes this opening tag, ignoring anything inside
    // quotes or braces (a prop value may itself contain '>' or JSX).
    while (cursor < code.length) {
      const char = code[cursor];
      if (quote) {
        // Step over an escaped character, or `\"` inside a string ends the
        // string early and the tag terminates at the wrong `>`.
        if (char === '\\') {
          cursor += 2;
          continue;
        }
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
      } else if (char === '>' && depth === 0) {
        break;
      }
      cursor += 1;
    }

    const attrText = code.slice(tag.lastIndex, cursor);
    usages.push({
      name: match[1],
      attrText,
      selfClosing: attrText.trimEnd().endsWith('/'),
      line: code.slice(0, match.index).split('\n').length,
    });
  }

  return usages;
}

const findUsages = (code) => scanTags(code, '<([A-Z][A-Za-z0-9]*)');

/**
 * Custom element usage: `<pf-button variant="primary">`. A separate scan
 * rather than a looser tag pattern, because the checks differ -- an element
 * takes kebab-case *attributes*, and some of its props have no attribute at
 * all.
 */
const findElementUsages = (code) => scanTags(code, '<(pf-[a-z][a-z0-9-]*)');

/**
 * An attribute name, including the sigils the framework bindings use.
 *
 * Without the sigils the scanner skips the punctuation and reads the bare word,
 * so `[formControl]="email"` arrives as an attribute called `formControl` and
 * then one called `email`, and `(pfChange)="onChange($event)"` adds `event` —
 * four invented-attribute errors on markup that is entirely correct. Capturing
 * them is what lets `isElementPassthrough` recognise each as a binding rather
 * than a typo. JSX has none of these forms, so the React scan is unaffected.
 */
const ATTRIBUTE_NAME = /^(?:\[\(?[\w.$-]+\)?\]|\(\[?[\w.$-]+\]?\)|[@:#*]?[A-Za-z_][\w:.$-]*)/;

function parseAttrs(attrText) {
  const attrs = [];
  let i = 0;

  const skipSpace = () => {
    while (i < attrText.length && /\s/.test(attrText[i])) i += 1;
  };

  /** Consume a balanced {...}, honouring nesting, quotes and nested JSX. */
  const skipBraced = () => {
    let depth = 0;
    let quote = null;
    const from = i;

    while (i < attrText.length) {
      const char = attrText[i];
      if (quote) {
        // Same escape rule as the tag scanner: without it, `\"` closes the
        // string early, the closing `}` is read as part of it, and every
        // attribute after this one is swallowed unchecked.
        if (char === '\\') {
          i += 2;
          continue;
        }
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'" || char === '`') {
        quote = char;
      } else if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          i += 1;
          return attrText.slice(from + 1, i - 1);
        }
      }
      i += 1;
    }
    return attrText.slice(from + 1);
  };

  while (i < attrText.length) {
    skipSpace();
    if (i >= attrText.length) break;

    // A spread ({...props}) contributes no name we can check, but its presence
    // matters: it may supply anything, so required props cannot be judged.
    if (attrText[i] === '{') {
      const body = skipBraced();
      if (body.trimStart().startsWith('...')) attrs.push({ name: null, spread: true });
      continue;
    }

    const nameMatch = ATTRIBUTE_NAME.exec(attrText.slice(i));
    if (!nameMatch) {
      i += 1;
      continue;
    }

    const name = nameMatch[0];
    i += name.length;
    skipSpace();

    if (attrText[i] !== '=') {
      attrs.push({ name, value: null, literal: false });
      continue;
    }

    i += 1;
    skipSpace();
    const opener = attrText[i];

    if (opener === '"' || opener === "'") {
      let cursor = i + 1;
      while (cursor < attrText.length && attrText[cursor] !== opener) {
        // Skip an escaped quote rather than ending the value on it.
        cursor += attrText[cursor] === '\\' ? 2 : 1;
      }
      attrs.push({ name, value: attrText.slice(i + 1, cursor), literal: true });
      i = Math.min(cursor + 1, attrText.length);
    } else if (opener === '{') {
      attrs.push({ name, value: skipBraced(), literal: false });
    } else {
      attrs.push({ name, value: null, literal: false });
    }
  }

  return attrs;
}

/**
 * String-literal union members, or null if the prop is not one.
 *
 * Both quote styles, because the two metadata sources disagree: the React
 * extractor reproduces the source, which this repo writes with single quotes,
 * while Stencil normalises every union member to double quotes
 * (`"ghost" | "primary"`). Accepting only single quotes made every variant
 * check on every element silently pass -- which is how `variant="ghostly"`
 * came back clean from a validator whose whole job is to catch it.
 */
function unionMembers(type) {
  if (!type || !type.includes('|')) return null;
  if (!type.includes("'") && !type.includes('"')) return null;
  const members = type.split('|').map((part) => part.trim());
  if (!members.every((m) => /^'[^']*'$/.test(m) || /^"[^"]*"$/.test(m))) return null;
  return members.map((m) => m.slice(1, -1));
}

/**
 * Props whose value is an icon name. `Icon` takes `name`; the components that
 * render one internally take `iconName`.
 */
const isIconProp = (component, propName) =>
  propName === 'iconName' || (component === 'Icon' && propName === 'name');

/**
 * Global attributes legitimate on any custom element. Shorter than the React
 * list on purpose: an element does not spread onto a native node, so an
 * attribute that is not one of these and not a declared one really is invented.
 * `on*` is lowercase in HTML and `onPf*` in the generated React bindings, so
 * both spellings pass.
 */
const ELEMENT_GLOBAL_ATTRIBUTES = new Set([
  'accesskey',
  'autocapitalize',
  'autofocus',
  'class',
  'className',
  'contenteditable',
  'dir',
  'draggable',
  'enterkeyhint',
  'hidden',
  'id',
  'inert',
  'inputmode',
  'is',
  'itemid',
  'itemprop',
  'itemref',
  'itemscope',
  'itemtype',
  'key',
  'lang',
  'nonce',
  'part',
  'popover',
  'ref',
  'slot',
  'spellcheck',
  'style',
  'tabindex',
  'title',
  'translate',
]);

const isElementPassthrough = (name) =>
  ELEMENT_GLOBAL_ATTRIBUTES.has(name) ||
  name.startsWith('data-') ||
  name.startsWith('aria-') ||
  // A plain HTML listener, a binding's `onPfChange`, and Vue's `@pf-change`
  // and `:value` all name something real that is not a declared attribute.
  /^on[A-Za-z]/.test(name) ||
  name.startsWith('@') ||
  name.startsWith(':') ||
  name.startsWith('v-') ||
  // Angular's own binding and reference syntax, which the generated
  // components take: [prop], (event), [(ngModel)], *ngIf, #ref.
  /^[[(#*]/.test(name);

/**
 * Checks `<pf-*>` usage against the element metadata.
 *
 * Two failures here have no equivalent on the React side, and both are silent:
 * a prop with **no attribute** cannot be set from markup at all (an array or a
 * function prop -- `sources`, `isDateDisabled`), and an unreflected prop set as
 * a property leaves no attribute for a stylesheet or a query to find. The first
 * is reported, because writing it as an attribute does nothing whatsoever.
 */
function validateElements(code, elementsByTag, findings) {
  const tags = [...elementsByTag.keys()];

  for (const usage of findElementUsages(code)) {
    const element = elementsByTag.get(usage.name);

    if (!element) {
      const suggestion = closest(usage.name, tags);
      findings.push({
        severity: 'error',
        line: usage.line,
        component: usage.name,
        message:
          `\`<${usage.name}>\` is not an element in this library.` +
          (suggestion ? ` Did you mean \`<${suggestion}>\`?` : ''),
      });
      continue;
    }

    const byAttr = new Map();
    const propsWithoutAttr = new Map();
    for (const prop of element.props) {
      if (prop.attr) byAttr.set(prop.attr, prop);
      else propsWithoutAttr.set(prop.name.toLowerCase(), prop);
    }

    for (const attr of parseAttrs(usage.attrText)) {
      if (attr.spread || !attr.name) continue;
      const prop = byAttr.get(attr.name);

      if (!prop) {
        // A prop that has no attribute, written as one. The markup parses, the
        // element renders, and the value never arrives.
        const propertyOnly = propsWithoutAttr.get(attr.name.toLowerCase());
        if (propertyOnly) {
          findings.push({
            severity: 'error',
            line: usage.line,
            component: usage.name,
            message:
              `\`${propertyOnly.name}\` on \`<${usage.name}>\` is \`${propertyOnly.type}\`, ` +
              'which has no attribute — setting it in markup does nothing. Assign the ' +
              'property in JavaScript, or pass it as a prop through one of the framework ' +
              'bindings.',
          });
          continue;
        }
        // The camelCase property name where the attribute is kebab-case. Real
        // as a *property*, so this is only worth saying in markup.
        const camel = byAttr.get(attr.name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`));
        if (camel) {
          findings.push({
            severity: 'warning',
            line: usage.line,
            component: usage.name,
            message:
              `\`${attr.name}\` is the property name; the attribute is ` +
              `\`${camel.attr}\`. Correct in a framework binding, inert in plain HTML.`,
          });
          continue;
        }
        if (isElementPassthrough(attr.name)) continue;
        const suggestion = closest(attr.name, [...byAttr.keys()]);
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message: suggestion
            ? `\`<${usage.name}>\` has no attribute \`${attr.name}\`. Did you mean \`${suggestion}\`?`
            : `\`<${usage.name}>\` has no attribute \`${attr.name}\`. ` +
              (byAttr.size
                ? `Its attributes are: ${[...byAttr.keys()].map((n) => `\`${n}\``).join(', ')}.`
                : 'It takes no attributes of its own.'),
        });
        continue;
      }

      const members = unionMembers(prop.type);
      if (members && attr.literal && attr.value !== null && !members.includes(attr.value)) {
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message:
            `\`${attr.name}="${attr.value}"\` is not valid on \`<${usage.name}>\`. ` +
            `Expected one of: ${members.map((m) => `"${m}"`).join(', ')}.`,
        });
      }
    }
  }
}

export function validateUsage(code, componentsByName, icons = null, elementsByTag = null) {
  const findings = [];
  const known = [...componentsByName.keys()];

  for (const usage of findUsages(code)) {
    const component = componentsByName.get(usage.name);

    if (!component) {
      /*
       * `<PfButton>` is a real component -- from one of the generated bindings
       * rather than from @pitchfork-ui/react. Saying "not exported by the
       * library" about it would be wrong and would send an agent looking for a
       * typo it has not made.
       */
      const binding = elementsByTag?.get(toTag(usage.name));
      if (binding) {
        findings.push({
          severity: 'warning',
          line: usage.line,
          component: usage.name,
          message:
            `\`${usage.name}\` is the generated binding for \`<${binding.tag}>\`, ` +
            'not a @pitchfork-ui/react component. Import it from ' +
            '@pitchfork-ui/elements-react (or -angular, -vue), or use ' +
            (binding.reactCounterpart
              ? `\`${binding.reactCounterpart}\` from @pitchfork-ui/react.`
              : 'the element directly.'),
        });
        continue;
      }

      const suggestion = closest(usage.name, known);
      findings.push({
        severity: 'error',
        line: usage.line,
        component: usage.name,
        message:
          `\`${usage.name}\` is not exported by the library.` +
          (suggestion ? ` Did you mean \`${suggestion}\`?` : ''),
      });
      continue;
    }

    const attrs = parseAttrs(usage.attrText);
    const seen = new Set(attrs.map((a) => a.name));
    // `{...props}` can supply any prop, so a missing required one proves nothing.
    const hasSpread = attrs.some((a) => a.spread);
    const propsByName = new Map(component.props.map((p) => [p.name, p]));

    for (const attr of attrs) {
      if (attr.spread) continue;
      const prop = propsByName.get(attr.name);

      if (!prop) {
        if (isPassthrough(attr.name)) continue;
        // The prop list is known to be partial (the component extends a type
        // from outside the library), so an unlisted prop proves nothing.
        if (component.propsComplete === false) continue;
        const suggestion = closest(attr.name, [...propsByName.keys()]);
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message: suggestion
            ? `\`${usage.name}\` has no prop \`${attr.name}\`. Did you mean \`${suggestion}\`?`
            : `\`${usage.name}\` has no prop \`${attr.name}\`, and it is not a DOM attribute. ` +
              (propsByName.size
                ? `Its props are: ${[...propsByName.keys()].map((n) => `\`${n}\``).join(', ')}.`
                : `It takes no props of its own — only ${component.extends?.join(', ') || 'DOM'} attributes.`),
        });
        continue;
      }

      // `IconName` widens to `string`, so the type cannot catch this: an
      // unregistered name is accepted everywhere and renders nothing.
      if (
        icons?.available &&
        isIconProp(usage.name, attr.name) &&
        attr.literal &&
        attr.value !== null &&
        !icons.resolves(attr.value)
      ) {
        const suggestion = closest(attr.value, [...icons.names]);
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message:
            `\`${attr.name}="${attr.value}"\` is not an icon the library resolves, ` +
            'so it renders nothing. ' +
            (suggestion
              ? `Did you mean \`"${suggestion}"\`?`
              : 'Pitchfork UI bundles a set of icons rather than all of Font Awesome.') +
            ' Add it with `registerIcons()` if you need it.',
        });
        continue;
      }

      const members = unionMembers(prop.type);
      if (members && attr.literal && attr.value !== null && !members.includes(attr.value)) {
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message:
            `\`${attr.name}="${attr.value}"\` is not valid on \`${usage.name}\`. ` +
            `Expected one of: ${members.map((m) => `"${m}"`).join(', ')}.`,
        });
      }
    }

    for (const prop of component.props) {
      if (hasSpread) break;
      // `children` is normally supplied by nesting, not as an attribute.
      if (prop.name === 'children' && !usage.selfClosing) continue;
      if (prop.required && !seen.has(prop.name)) {
        findings.push({
          severity: 'error',
          line: usage.line,
          component: usage.name,
          message: `\`${usage.name}\` requires the \`${prop.name}\` prop (${prop.type}).`,
        });
      }
    }
  }

  if (elementsByTag) validateElements(code, elementsByTag, findings);

  // Hardcoded colours are the single most common design-system violation, and
  // the reason the token chain exists.
  const colour = /#[0-9a-fA-F]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/g;
  let match;
  while ((match = colour.exec(code)) !== null) {
    findings.push({
      severity: 'warning',
      line: code.slice(0, match.index).split('\n').length,
      component: null,
      message:
        `Hardcoded colour \`${match[0].trim()}\`. Use a CSS variable instead — ` +
        `component styles go through a \`--pf-*\` alias, never a raw value.`,
    });
  }

  return findings;
}

/** `PfNavItem` → `pf-nav-item`, the inverse of what every binding generator does. */
const toTag = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();

// Exported so the scanner and the server's suggestions can be exercised directly.
export { closest, findElementUsages, findUsages, parseAttrs, toTag, unionMembers };
