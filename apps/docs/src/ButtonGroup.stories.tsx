import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Button Group',
  component: ButtonGroup,
  tags: ['ai-generated', 'test'],
  args: {
    'aria-label': 'Time range',
    items: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'week', label: 'This week' },
    ],
    defaultValue: 'today',
    multiple: false,
    disabled: false,
  },
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    'aria-label': 'Time range',
    items: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'week', label: 'This week' },
    ],
    defaultValue: 'today',
  },
};
