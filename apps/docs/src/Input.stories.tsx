import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Input } from '@pitchfork-ui/react';

const meta = {
  component: Input,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    description: 'We will never share your email.',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = {
  args: { error: 'Enter a valid email address.' },
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText(/email address/i);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  },
};
