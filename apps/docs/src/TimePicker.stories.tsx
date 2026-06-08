import type { Meta, StoryObj } from '@storybook/react-vite';
import { TimePicker } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/TimePicker',
  component: TimePicker,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Start time',
    description: 'Choose when the event begins.',
    placeholder: 'Select time',
    hourCycle: 24,
    minuteStep: 5,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    hourCycle: { control: 'inline-radio', options: [12, 24] },
    minuteStep: { control: 'number' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    onValueChange: { action: 'value changed' },
  },
} satisfies Meta<typeof TimePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive time picker',
    description: 'Adjust hour cycle and minute step from the controls.',
  },
};
