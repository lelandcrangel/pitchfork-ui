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

/** Props every React component accepts, plus the usual native passthroughs. */
const ALWAYS_ALLOWED = new Set([
  'key',
  'ref',
  'className',
  'style',
  'id',
  'children',
  'role',
  'tabIndex',
  'title',
  'slot',
  'lang',
  'dir',
  'hidden',
  'draggable',
  'translate',
]);

const isPassthrough = (name) =>
  ALWAYS_ALLOWED.has(name) ||
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

    usages.push({
      name: match[1],
      attrText: code.slice(tag.lastIndex, cursor),
      line: code.slice(0, match.index).split('\n').length,
    });
  }

  return usages;
}

function parseAttrs(attrText) {
  const attrs = [];
  const pattern = /([A-Za-z_][\w:-]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|\{([\s\S]*?)\}))?/g;
  let match;

  while ((match = pattern.exec(attrText)) !== null) {
    const [, name, double, single, braced] = match;
    if (!name) continue;
    attrs.push({
      name,
      value: double ?? single ?? braced ?? null,
      // A bare `disabled` is boolean true; a quoted value is a string literal.
      literal: double !== undefined || single !== undefined,
    });
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
        const suggestion = closest(attr.name, [...propsByName.keys()]);
        if (suggestion) {
          findings.push({
            severity: 'error',
            line: usage.line,
            component: usage.name,
            message: `\`${usage.name}\` has no prop \`${attr.name}\`. Did you mean \`${suggestion}\`?`,
          });
        }
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
