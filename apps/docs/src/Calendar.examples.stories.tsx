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
    autoSelectToday: false,
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const randomDayThisMonth = (() => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return new Date(now.getFullYear(), now.getMonth(), day);
})();

export const PreselectedDay: Story = {
  args: {
    description: 'A date is preselected by default.',
    defaultValue: randomDayThisMonth,
  },
};

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
  parameters: {
    docs: {
      source: {
        code: `const disableWeekends = (date: Date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

<Calendar
  label="Event date"
  description="Weekends are unavailable for scheduling."
  disabledDates={disableWeekends}
/>`,
      },
    },
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
