import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElementPlayground } from '../ElementPlayground';
import { elementExamples } from '../element-examples';

// Generated from packages/elements/dist/docs.json by
// scripts/build-elements-docs.mjs. The markup comes from
// apps/docs/src/element-examples.ts; edit it there.

const example = elementExamples['pf-calendar'];

const meta = {
  title: 'Web components/PfCalendar',
  args: { label: 'Departure date', showOutsideDays: true, value: '2026-03-15' },
  argTypes: {
    endYear: { control: 'number' },
    isDateDisabled: { control: false },
    label: { control: 'text' },
    max: { control: 'text' },
    min: { control: 'text' },
    showOutsideDays: { control: 'boolean' },
    startYear: { control: 'number' },
    value: { control: 'text' },
  },
  render: (args) => (
    <ElementPlayground
      tag="pf-calendar"
      html={example.interactive ?? example.html}
      args={args}
      setup={example.setup}
    />
  ),
} satisfies Meta;

export default meta;

export const Interactive: StoryObj<typeof meta> = {};
