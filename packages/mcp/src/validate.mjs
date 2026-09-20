/**
 * Usage validation.
 *
 * The point of difference: most component-library MCP servers only read. This
 * checks a snippet against the real API and says what is wrong.
 *
 * Every check here is chosen to have effectively no false positives, because a
 * validator that cries wolf gets ignored. Notably it does NOT flag unrecognised
 * props outright: nearly every component spreads onto a native element, so
 * `onMouseEnter` or `data-testid` are perfectly valid. It flags an unknown prop
 * only when it looks like a typo of a real one.
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
function findUsages(code) {
  const usages = [];
  const tag = /<([A-Z][A-Za-z0-9]*)/g;
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

    // A spread ({...props}) contributes no name we can check.
    if (attrText[i] === '{') {
      skipBraced();
      continue;
    }

    const nameMatch = /^[A-Za-z_][\w:.-]*/.exec(attrText.slice(i));
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

/** String-literal union members, or null if the prop is not one. */
function unionMembers(type) {
  if (!type || !type.includes('|') || !type.includes("'")) return null;
  const members = type.split('|').map((part) => part.trim());
  if (!members.every((m) => /^'[^']*'$/.test(m))) return null;
  return members.map((m) => m.slice(1, -1));
}

export function validateUsage(code, componentsByName) {
  const findings = [];
  const known = [...componentsByName.keys()];

  for (const usage of findUsages(code)) {
    const component = componentsByName.get(usage.name);

    if (!component) {
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
    const propsByName = new Map(component.props.map((p) => [p.name, p]));

    for (const attr of attrs) {
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

// Exported so the scanner and the server's suggestions can be exercised directly.
export { closest, findUsages, parseAttrs, unionMembers };
