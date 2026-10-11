import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-accordion-item'];

const meta = {
  title: 'Components/AccordionItem',
  args: { disabled: false, expanded: true, headingLevel: 3, value: 'one' },
  argTypes: {
    disabled: { control: 'boolean' },
    expanded: { control: 'boolean' },
    headingLevel: { control: 'select', options: [2, 3, 4, 5, 6] },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-accordion-item"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
