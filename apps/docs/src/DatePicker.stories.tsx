import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/DatePicker',
  component: DatePicker,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Start date',
    description: 'Choose the date this period begins.',
    defaultValue: new Date(2026, 4, 22),
    placeholder: 'Select a date',
    showOutsideDays: true,
    allowClear: true,
  },
  argTypes: {
    showOutsideDays: { control: 'boolean' },
    allowClear: { control: 'boolean' },
    disabledDates: { control: false },
    onValueChange: { control: false },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <DatePicker {...args} />,
};
