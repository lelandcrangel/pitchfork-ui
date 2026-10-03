#!/usr/bin/env node
/**
 * Pitchfork UI MCP server.
 *
 * Serves the generated component metadata, design tokens and house conventions
 * over the Model Context Protocol, so a coding agent can build with the library
 * from its real API rather than from guesswork.
 *
 * Everything it returns is derived from source at build time — see
 * scripts/build-metadata.mjs. This process holds no knowledge of its own.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import {
  componentsByName,
  elementForComponent,
  elementMetadata,
  elementsByName,
  elementsByTag,
  iconNames,
  iconRegistryAvailable,
  metadata,
  metadataPath,
  resolvesIconName,
  tokens,
} from './data.mjs';
import { closest, validateUsage } from './validate.mjs';

const text = (body) => ({ content: [{ type: 'text', text: body }] });

/* ------------------------------------------------------------------ *
 * Rendering
 *
 * Tools return Markdown rather than raw JSON: it costs fewer tokens than the
 * equivalent object and models act on it more reliably.
 * ------------------------------------------------------------------ */
const summaryOf = (component) => {
  const description =
    component.description ||
    (component.folder ? `Part of ${component.folder}.` : `The \`${component.tag}\` element.`);
  const match = description.match(/^.*?[.!?](?=\s|$)/);
  return (match ? match[0] : description).trim();
};

function renderComponent(component) {
  const lines = [`# ${component.name}`, ''];
  lines.push(`Category: ${component.category}`);
  lines.push(`Import: \`import { ${component.name} } from '${metadata.name}';\``);
  const coverage = elementForComponent.get(component.name);
  if (coverage) {
    lines.push(
      `Custom element: \`<${coverage.tag}>\`` +
        (coverage.absorbed ? ` — ${coverage.how}` : ' (`get_element` for its API).'),
    );
  }
  if (component.forwardsRef) lines.push('Forwards its ref to the underlying element.');
  lines.push('');

  if (component.description) lines.push(component.description, '');
  if (component.extends?.length) {
    lines.push(`Also accepts every prop of \`${component.extends.join('`, `')}\`.`, '');
  }

  lines.push('## Props', '');
  if (component.props.length) {
    lines.push('| Prop | Type | Default | Required |', '| --- | --- | --- | --- |');
    for (const p of component.props) {
      const type = p.type.replace(/\|/g, '\\|');
      lines.push(
        `| \`${p.name}\` | \`${type}\` | ${p.default ? `\`${p.default}\`` : '—'} | ${p.required ? 'yes' : 'no'} |`,
      );
    }
  } else {
    lines.push('_No component-specific props._');
  }
  lines.push('');

  if (component.a11y?.length) {
    lines.push('## Accessibility', '');
    for (const note of component.a11y) lines.push(`- ${note}`);
    lines.push('');
  }

  const aliases = component.cssVars.filter((v) => v.kind === 'alias');
  if (aliases.length) {
    lines.push('## Theme variables', '');
    lines.push('Override these, never the component CSS:', '');
    for (const v of aliases) {
      const target = v.chain
        ?.slice(1)
        .filter((s) => s.startsWith('--'))
        .pop();
      lines.push(target ? `- \`${v.name}\` → \`${target}\`` : `- \`${v.name}\``);
    }
    lines.push('');
  }

  const [example] = component.examples ?? [];
  if (example) {
    lines.push('## Example', '', '```tsx', example.code, '```', '');
    if (component.examples.length > 1) {
      lines.push(`_${component.examples.length - 1} more via \`get_examples\`._`, '');
    }
  }

  return lines.join('\n');
}

function renderElement(element) {
  const lines = [`# <${element.tag}>`, ''];
  lines.push(`Category: ${element.category ?? 'uncategorised'}`);
  lines.push(`Import: \`import '${elementMetadata.name}/components/${element.tag}.js';\``);
  lines.push(
    `Bindings: \`${element.name}\` from \`${elementMetadata.bindings.react}\`, ` +
      `\`${elementMetadata.bindings.angular}\` or \`${elementMetadata.bindings.vue}\`.`,
  );
  if (element.reactCounterpart) {
    lines.push(`React counterpart: \`${element.reactCounterpart}\` — \`get_component\` for it.`);
  }
  if (element.childOf) {
    lines.push(`Goes inside \`<${element.childOf}>\`.`);
  }
  if (element.formAssociated) {
    lines.push('Form-associated: it submits with a surrounding `<form>` under its `name`.');
  }
  lines.push('');

  if (element.description) lines.push(element.description, '');

  lines.push('## Props', '');
  if (element.props.length) {
    lines.push('| Prop | Attribute | Type | Default |', '| --- | --- | --- | --- |');
    for (const prop of element.props) {
      const type = prop.type.replace(/\|/g, '\\|');
      lines.push(
        `| \`${prop.name}\` | ${prop.attr ? `\`${prop.attr}\`` : '_property only_'} | ` +
          `\`${type}\` | ${prop.default ? `\`${prop.default}\`` : '—'} |`,
      );
    }
    const propertyOnly = element.props.filter((prop) => !prop.attr);
    if (propertyOnly.length) {
      lines.push(
        '',
        `\`${propertyOnly.map((p) => p.name).join('`, `')}\` have no attribute — ` +
          'set them as properties, or as props through a binding. Writing them in ' +
          'markup does nothing.',
      );
    }
  } else {
    lines.push('_No props._');
  }
  lines.push('');

  if (element.events.length) {
    lines.push('## Events', '');
    for (const event of element.events) {
      lines.push(
        `- \`${event.name}\`${event.detail ? ` — detail \`${event.detail}\`` : ''}` +
          `${event.description ? `: ${event.description.split('\n')[0]}` : ''}`,
      );
    }
    lines.push(
      '',
      'In the React bindings these are `on` + the event name (`pfChange` → `onPfChange`).',
      '',
    );
  }

  if (element.methods.length) {
    lines.push('## Methods', '');
    for (const method of element.methods) lines.push(`- \`${method.signature}\``);
    lines.push('', 'Every method is async — a custom element resolves them off its queue.', '');
  }

  if (element.slots.length) {
    lines.push('## Slots', '');
    for (const slot of element.slots) {
      lines.push(`- ${slot.name ? `\`${slot.name}\`` : '_default_'}: ${slot.description}`);
    }
    lines.push('');
  }

  if (element.parts.length) {
    lines.push('## Parts', '');
    lines.push(`Style these with \`${element.tag}::part(name)\`; selectors do not cross a`);
    lines.push('shadow boundary, so these are the only reachable internals.', '');
    for (const part of element.parts) lines.push(`- \`${part.name}\`: ${part.description}`);
    lines.push('');
  }

  return lines.join('\n');
}

const notFound = (name) => {
  const names = [...componentsByName.keys()];
  const suggestion = closest(name, names);
  const contains = names
    .filter((n) => n.toLowerCase().includes(name.toLowerCase()) && n !== suggestion)
    .slice(0, 4);
  const near = [suggestion, ...contains].filter(Boolean);

  return text(
    `No component named \`${name}\`.` +
      (near.length ? ` Did you mean: ${near.join(', ')}?` : '') +
      ` Use \`list_components\` or \`search_components\` to find one.`,
  );
};

/* ------------------------------------------------------------------ *
 * Server
 * ------------------------------------------------------------------ */
const elementNotFound = (name) => {
  const tags = [...elementsByTag.keys()];
  const suggestion = closest(name.toLowerCase().startsWith('pf-') ? name : `pf-${name}`, tags);
  const component = componentsByName.get(name);

  if (component) {
    const coverage = elementForComponent.get(name);
    return text(
      `\`${name}\` is a React component, not an element.` +
        (coverage
          ? ` The element for it is \`<${coverage.tag}>\`` +
            (coverage.absorbed ? ` — ${coverage.how}` : '.')
          : ''),
    );
  }

  return text(
    `No element named \`${name}\`.` +
      (suggestion ? ` Did you mean \`${suggestion}\`?` : '') +
      ' Use `list_elements` to see them all.',
  );
};

const server = new McpServer({ name: 'pitchfork-ui', version: metadata.version });

server.registerTool(
  'list_components',
  {
    title: 'List components',
    description:
      'List every component in Pitchfork UI, optionally filtered to one category. ' +
      'Start here to find out what the library offers.',
    inputSchema: { category: z.enum(metadata.categories).optional() },
  },
  async ({ category }) => {
    const matches = category
      ? metadata.components.filter((c) => c.category === category)
      : metadata.components;

    if (!matches.length) return text(`No components in category \`${category}\`.`);

    const grouped = new Map();
    for (const component of matches) {
      if (!grouped.has(component.category)) grouped.set(component.category, []);
      grouped.get(component.category).push(component);
    }

    const lines = [`${matches.length} components (${metadata.name}@${metadata.version}).`, ''];
    for (const [group, members] of grouped) {
      lines.push(`## ${group}`, '');
      for (const component of members)
        lines.push(`- **${component.name}** — ${summaryOf(component)}`);
      lines.push('');
    }
    return text(lines.join('\n'));
  },
);

server.registerTool(
  'search_components',
  {
    title: 'Search components',
    description:
      'Find components by describing what you need in plain language, e.g. ' +
      '"upload a file", "show a loading state", "pick a date range".',
    inputSchema: {
      query: z.string().min(1).describe('What you are trying to build'),
      limit: z.number().int().min(1).max(25).optional(),
    },
  },
  async ({ query, limit = 8 }) => {
    const terms = query
      .toLowerCase()
      .split(/\W+/)
      .filter((t) => t.length > 2);
    if (!terms.length) return text('Query too short — give a word or two of context.');

    const scored = metadata.components
      .map((component) => {
        const name = component.name.toLowerCase();
        const words = new Set(
          `${name} ${component.category} ${component.description ?? ''}`
            .toLowerCase()
            .split(/\W+/)
            .filter(Boolean),
        );
        let score = 0;
        for (const term of terms) {
          if (name === term) score += 20;
          else if (name.includes(term)) score += 8;
          if (component.category === term) score += 4;
          // Whole words only — substring matching pairs "file" with "profile".
          if (words.has(term)) score += 2;
        }
        return { component, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.component.name.localeCompare(b.component.name))
      .slice(0, limit);

    if (!scored.length) {
      return text(`Nothing matched "${query}". Try \`list_components\` to browse by category.`);
    }

    return text(
      [
        `${scored.length} match(es) for "${query}":`,
        '',
        ...scored.map(
          ({ component }) =>
            `- **${component.name}** (${component.category}) — ${summaryOf(component)}`,
        ),
        '',
        'Use `get_component` for the full API.',
      ].join('\n'),
    );
  },
);

server.registerTool(
  'get_component',
  {
    title: 'Get a component API',
    description:
      'The full API for one component: props with types and defaults, what it ' +
      'extends, its accessibility contract, its theme variables and an example. ' +
      'Read this before writing code that uses the component.',
    inputSchema: { name: z.string().describe('Component name, e.g. "Button"') },
  },
  async ({ name }) => {
    const component = componentsByName.get(name);
    return component ? text(renderComponent(component)) : notFound(name);
  },
);

server.registerTool(
  'get_examples',
  {
    title: 'Get component examples',
    description: 'Every worked example for a component, as copy-ready JSX.',
    inputSchema: { name: z.string().describe('Component name, e.g. "Table"') },
  },
  async ({ name }) => {
    const component = componentsByName.get(name);
    if (!component) return notFound(name);
    if (!component.examples?.length) {
      return text(`\`${name}\` has no examples. Use \`get_component\` for its props.`);
    }

    const lines = [`# ${name} examples`, ''];
    for (const example of component.examples) {
      lines.push(`## ${example.name}`, '', '```tsx', example.code, '```', '');
    }
    return text(lines.join('\n'));
  },
);

server.registerTool(
  'list_elements',
  {
    title: 'List custom elements',
    description:
      'List every custom element in @pitchfork-ui/elements, the framework-free ' +
      'half of the library. Use these in Angular, Vue, plain HTML, or anywhere ' +
      'the React components do not fit — they are a first-class layer, not ' +
      'wrappers around the React components.',
    inputSchema: { category: z.enum(elementMetadata.categories).optional() },
  },
  async ({ category }) => {
    const matches = category
      ? elementMetadata.elements.filter((e) => e.category === category)
      : elementMetadata.elements;

    if (!matches.length) return text(`No elements in category \`${category}\`.`);

    const grouped = new Map();
    for (const element of matches) {
      const key = element.category ?? 'uncategorised';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(element);
    }

    const lines = [
      `${matches.length} elements (${elementMetadata.name}@${elementMetadata.version}).`,
      '',
    ];
    for (const [group, members] of grouped) {
      lines.push(`## ${group}`, '');
      for (const element of members) {
        const notes = [
          element.childOf ? `inside \`<${element.childOf}>\`` : null,
          element.formAssociated ? 'form control' : null,
        ].filter(Boolean);
        lines.push(
          `- **<${element.tag}>** — ${summaryOf(element)}` +
            (notes.length ? ` _(${notes.join(', ')})_` : ''),
        );
      }
      lines.push('');
    }
    lines.push('Use `get_element` for the full API of one.');
    return text(lines.join('\n'));
  },
);

server.registerTool(
  'get_element',
  {
    title: 'Get a custom element API',
    description:
      'The full API for one custom element: props with their attributes and ' +
      'defaults, events, async methods, slots and `::part()` names, plus its ' +
      'React counterpart. Read this before writing markup that uses the element.',
    inputSchema: {
      name: z.string().describe('Element tag or binding name, e.g. "pf-button" or "PfButton"'),
    },
  },
  async ({ name }) => {
    const element = elementsByTag.get(name) ?? elementsByName.get(name);
    return element ? text(renderElement(element)) : elementNotFound(name);
  },
);

server.registerTool(
  'get_tokens',
  {
    title: 'Get design tokens',
    description:
      'The design token tree — colours, spacing, radii, typography, shadows, motion. ' +
      'Use these values to stay on-system; never invent a colour or spacing value.',
    inputSchema: {
      group: z.enum(Object.keys(tokens)).optional().describe('Limit to one group, e.g. "color"'),
    },
  },
  async ({ group }) => {
    const subset = group ? { [group]: tokens[group] } : tokens;
    return text(
      [
        group ? `# Tokens — ${group}` : '# Design tokens',
        '',
        'Reference these as CSS variables: `color.brand.600` is `var(--color-brand-600)`.',
        'In component CSS, go through a `--pf-*` theme alias rather than using a token directly.',
        '',
        '```json',
        JSON.stringify(subset, null, 2),
        '```',
      ].join('\n'),
    );
  },
);

server.registerTool(
  'get_conventions',
  {
    title: 'Get house conventions',
    description:
      'The rules that make code look like it belongs in this design system: ' +
      'TypeScript and forwardRef patterns, CSS class naming, the CSS variable ' +
      'inheritance chain, responsive breakpoints, icons, form fields and ' +
      'accessibility. Read this before writing or reviewing component code.',
    inputSchema: {},
  },
  async () => text(metadata.conventions),
);

server.registerTool(
  'validate_usage',
  {
    title: 'Validate component usage',
    description:
      'Check a JSX snippet against the real component API. Reports unknown ' +
      'components, invalid variant values, missing required props, likely prop ' +
      'typos and hardcoded colours. Also checks `<pf-*>` element markup: ' +
      'unknown tags, attributes that do not exist, and props that have no ' +
      'attribute at all and so cannot be set from markup. Run this on code you ' +
      'generated before presenting it.',
    inputSchema: { code: z.string().min(1).describe('The JSX snippet to check') },
  },
  async ({ code }) => {
    const findings = validateUsage(
      code,
      componentsByName,
      {
        available: iconRegistryAvailable,
        resolves: resolvesIconName,
        names: iconNames,
      },
      elementsByTag,
    );
    if (!findings.length) {
      return text('No problems found. Components, props and values all check out.');
    }

    const errors = findings.filter((f) => f.severity === 'error');
    const warnings = findings.filter((f) => f.severity === 'warning');
    const lines = [
      `${errors.length} error(s), ${warnings.length} warning(s).`,
      '',
      ...findings
        .sort((a, b) => a.line - b.line)
        .map((f) => `- **${f.severity}** (line ${f.line}): ${f.message}`),
    ];
    return text(lines.join('\n'));
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);

// stdout is the protocol channel; anything informational has to go to stderr.
console.error(
  `pitchfork-ui MCP server ready — ${metadata.components.length} components ` +
    `from ${metadata.name}@${metadata.version} (${metadataPath}) and ` +
    `${elementMetadata.elements.length} elements from ` +
    `${elementMetadata.name}@${elementMetadata.version}`,
);
