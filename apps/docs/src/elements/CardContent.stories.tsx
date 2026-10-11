import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-card-content'];

const meta = {
  title: 'Components/CardContent',
  args: { children: 'The body of the card. Padding and type come from the element.' },
  argTypes: { children: { control: 'text' } },
  render: (args) => (
    <ElementPlayground
      tag="pf-card-content"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
