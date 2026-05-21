import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Switch } from '@pitchfork-ui/react';

const meta = {
  component: Switch,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Enable notifications',
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: {
    defaultChecked: true,
    label: 'Notify me',
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('switch', { name: /notify me/i }),
    ).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled switch',
  },
};
