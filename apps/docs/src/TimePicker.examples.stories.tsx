import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { TimePicker } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/TimePicker',
  component: TimePicker,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Start time',
    description: 'Choose when the event begins.',
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <TimePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TimePicker
  label="Start time"
  description="Choose when the event begins."
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('combobox', { name: /start time/i });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    await userEvent.click(trigger);
  },
};

export const TwelveHour: Story = {
  name: '12-hour with AM/PM',
  args: { hourCycle: 12, defaultValue: '09:30' },
  render: (args) => <TimePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TimePicker
  label="Start time"
  description="Choose when the event begins."
  hourCycle={12}
  defaultValue="09:30"
/>`,
      },
    },
  },
};

export const MinuteStep: Story = {
  name: '15-minute steps',
  args: { minuteStep: 15, defaultValue: '13:45' },
  render: (args) => <TimePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TimePicker
  label="Start time"
  description="Choose when the event begins."
  minuteStep={15}
  defaultValue="13:45"
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Please choose a start time.' },
  render: (args) => <TimePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TimePicker
  label="Start time"
  description="Choose when the event begins."
  error="Please choose a start time."
/>`,
      },
    },
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('combobox', { name: /start time/i });
    await expect(trigger).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: '08:00' },
  render: (args) => <TimePicker {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<TimePicker
  label="Start time"
  description="Choose when the event begins."
  defaultValue="08:00"
  disabled
/>`,
      },
    },
  },
};
