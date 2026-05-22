import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Enable notifications',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive checkbox',
  },
};
