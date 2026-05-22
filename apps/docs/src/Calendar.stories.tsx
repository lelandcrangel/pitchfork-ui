import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Calendar',
  component: Calendar,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Billing date',
    description: 'Pick the date your billing cycle starts.',
    defaultValue: new Date(2026, 4, 22),
    showOutsideDays: true,
  },
  argTypes: {
    showOutsideDays: { control: 'boolean' },
    startYear: { control: { type: 'number', min: 1900, max: 2100, step: 1 } },
    endYear: { control: { type: 'number', min: 1900, max: 2100, step: 1 } },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Calendar {...args} />,
};
