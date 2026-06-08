import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRangePicker } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/DateRangePicker',
  component: DateRangePicker,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Date range',
    description: 'Select a start and end date.',
    startPlaceholder: 'Start date',
    endPlaceholder: 'End date',
    disabled: false,
    required: false,
    showOutsideDays: true,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    startPlaceholder: { control: 'text' },
    endPlaceholder: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    showOutsideDays: { control: 'boolean' },
    onValueChange: { action: 'value changed' },
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive date range picker',
    description: 'Click to open, select start then end date.',
  },
};
