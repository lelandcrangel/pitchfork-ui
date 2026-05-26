import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as BadgeStories from './Badge.stories';
import * as ButtonStories from './Button.stories';
import * as CardStories from './Card.stories';
import * as CheckboxStories from './Checkbox.stories';
import * as AlertStories from './Alert.stories';
import * as InputStories from './Input.stories';
import * as SwitchStories from './Switch.stories';

const docsDir = dirname(fileURLToPath(import.meta.url));
const nonComponentDocs = new Set([
  'CHANGELOG.mdx',
  'Introduction.mdx',
  'Tokens.mdx',
]);

describe('storybook project stories', () => {
  it('loads core story modules', () => {
    expect(BadgeStories.default).toBeDefined();
    expect(ButtonStories.default).toBeDefined();
    expect(CardStories.default).toBeDefined();
    expect(CheckboxStories.default).toBeDefined();
    expect(AlertStories.default).toBeDefined();
    expect(InputStories.default).toBeDefined();
    expect(SwitchStories.default).toBeDefined();
  });

  it('contains interactive stories for core components', () => {
    expect(ButtonStories.Interactive).toBeDefined();
    expect(InputStories.Interactive).toBeDefined();
    expect(SwitchStories.Interactive).toBeDefined();
  });

  it('keeps interactive controls out of component docs pages', () => {
    const componentDocs = readdirSync(docsDir).filter(
      (filename) =>
        filename.endsWith('.mdx') && !nonComponentDocs.has(filename),
    );

    for (const filename of componentDocs) {
      const componentName = filename.replace(/\.mdx$/, '');
      const mdx = readFileSync(join(docsDir, filename), 'utf8');
      const story = readFileSync(
        join(docsDir, `${componentName}.stories.tsx`),
        'utf8',
      );

      expect(mdx, `${filename} should not import Controls`).not.toContain(
        'Controls',
      );
      expect(
        mdx,
        `${filename} should not have an Interactive section`,
      ).not.toContain('## Interactive');
      expect(
        mdx,
        `${filename} should not render the Interactive story`,
      ).not.toContain(`<Canvas of={${componentName}Stories.Interactive}`);
      expect(
        mdx,
        `${filename} should not show Interactive controls`,
      ).not.toContain(`<Controls of={${componentName}Stories.Interactive}`);
      expect(
        story,
        `${componentName}.stories.tsx exports Interactive`,
      ).toContain('export const Interactive');
    }
  });
});
