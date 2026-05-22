import type { Meta, StoryObj } from '@storybook/react-vite';
import { Calendar } from '@pitchfork-ui/react';

const disableWeekends = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const meta = {
  title: 'Examples/Calendar',
  component: Calendar,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Event date',
    description: 'Choose a date for the event.',
    defaultValue: new Date(2026, 4, 22),
  },
} satisfies Meta<typeof Calendar>;

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
    description: 'Weekends are unavailable for scheduling.',
    disabledDates: disableWeekends,
  },
};

export const BoundedYearRange: Story = {
  args: {
    description: 'Year options are constrained for quicker selection.',
    startYear: 2020,
    endYear: 2030,
  },
};

export const WithError: Story = {
  args: {
    error: 'Please select a valid date before continuing.',
  },
};
