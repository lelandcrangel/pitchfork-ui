import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-code-snippet'];

const meta = {
  title: 'Components/CodeSnippet',
  args: {
    code: 'npm install @pitchfork-ui/elements',
    copiedLabel: 'Copied',
    copyFailedLabel: 'Copy failed',
    copyLabel: 'Copy',
    feedbackDuration: 1600,
    showLineNumbers: false,
    heading: 'Install',
    language: 'bash',
  },
  argTypes: {
    code: { control: 'text' },
    copiedLabel: { control: 'text' },
    copyFailedLabel: { control: 'text' },
    copyLabel: { control: 'text' },
    feedbackDuration: { control: 'number' },
    heading: { control: 'text' },
    language: { control: 'text' },
    maxHeight: { control: 'number' },
    showLineNumbers: { control: 'boolean' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-code-snippet"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
