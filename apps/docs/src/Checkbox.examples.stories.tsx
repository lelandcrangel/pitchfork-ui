import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Checkbox } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Checkbox',
  component: Checkbox,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Enable notifications',
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: {
    defaultChecked: true,
    label: 'Accessible by default',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/accessible by default/i)).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    label: 'Disabled option',
  },
};
