import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Switch } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Enable notifications',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive switch',
  },
};
