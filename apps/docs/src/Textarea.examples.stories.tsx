import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Textarea } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Textarea',
  component: Textarea,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Description',
    placeholder: 'Write a short project description...',
    description: 'Keep it concise and specific.',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Prefilled: Story = {
  args: {
    defaultValue: 'Pitchfork UI is a fast component library for product teams.',
  },
};

export const WithError: Story = {
  args: {
    error: 'Please add at least 40 characters.',
  },
  play: async ({ canvas }) => {
    const field = canvas.getByLabelText(/description/i);
    await expect(field).toHaveAttribute('aria-invalid', 'true');
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Archived notes cannot be edited.',
  },
};
