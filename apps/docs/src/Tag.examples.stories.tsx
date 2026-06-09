import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Tag } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Tag',
  component: Tag,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    children: 'Design',
    variant: 'neutral',
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Brand: Story = {
  args: {
    children: 'Product',
    variant: 'brand',
  },
};

export const Success: Story = {
  args: {
    children: 'Published',
    variant: 'success',
  },
};

export const Warning: Story = {
  args: {
    children: 'Needs review',
    variant: 'warning',
  },
};

export const Danger: Story = {
  args: {
    children: 'Blocked',
    variant: 'danger',
  },
};

export const Dismissible: Story = {
  args: {
    children: 'Removable',
    dismissible: true,
    onDismiss: fn(),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: /remove tag/i }));
    await expect(args.onDismiss).toHaveBeenCalled();
  },
};
