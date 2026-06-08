import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRangePicker } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/DateRangePicker',
  component: DateRangePicker,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Date range',
    description: 'Select a start and end date.',
  },
} satisfies Meta<typeof DateRangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <DateRangePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  label="Date range"
  description="Select a start and end date."
/>`,
      },
    },
  },
};

export const WithDefaultValue: Story = {
  name: 'With default value',
  args: {
    defaultValue: {
      start: new Date(2025, 5, 10),
      end: new Date(2025, 5, 20),
    },
  },
  render: (args) => <DateRangePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  label="Date range"
  description="Select a start and end date."
  defaultValue={{
    start: new Date(2025, 5, 10),
    end: new Date(2025, 5, 20),
  }}
/>`,
      },
    },
  },
};

export const CustomPlaceholders: Story = {
  name: 'Custom placeholders',
  args: {
    label: 'Stay dates',
    description: 'Select your check-in and check-out dates.',
    startPlaceholder: 'Check-in',
    endPlaceholder: 'Check-out',
  },
  render: (args) => <DateRangePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  label="Stay dates"
  description="Select your check-in and check-out dates."
  startPlaceholder="Check-in"
  endPlaceholder="Check-out"
/>`,
      },
    },
  },
};

export const WithError: Story = {
  name: 'With error',
  args: {
    error: 'Please select a valid date range.',
  },
  render: (args) => <DateRangePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  label="Date range"
  description="Select a start and end date."
  error="Please select a valid date range."
/>`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <DateRangePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<DateRangePicker
  label="Date range"
  description="Select a start and end date."
  disabled
/>`,
      },
    },
  },
};
