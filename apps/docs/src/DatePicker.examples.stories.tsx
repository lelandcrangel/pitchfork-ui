import type { Meta, StoryObj } from '@storybook/react-vite';
import { DatePicker } from '@pitchfork-ui/react';

const disableWeekends = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const meta = {
  title: 'Examples/DatePicker',
  component: DatePicker,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Event date',
    defaultValue: new Date(2026, 4, 22),
  },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoOutsideDays: Story = {
  args: {
    showOutsideDays: false,
  },
};

export const DisabledWeekends: Story = {
  args: {
    description: 'Weekends are disabled.',
    disabledDates: disableWeekends,
  },
};

export const BoundedYearRange: Story = {
  args: {
    startYear: 2020,
    endYear: 2030,
    allowClear: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Please choose a valid date.',
  },
};
