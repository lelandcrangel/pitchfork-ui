import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Button } from '@pitchfork-ui/react';

const meta = {
  component: Button,
  tags: ['ai-generated', 'test'],
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
  },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Order now',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /order now/i });
    await expect(button).toHaveAttribute('type', 'button');
  },
};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Ghost: Story = { args: { variant: 'ghost' } };
export const Disabled: Story = { args: { disabled: true } };

export const CssCheck: Story = {
  args: {
    children: 'Submit',
    variant: 'primary',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /submit/i });
    await expect(getComputedStyle(button).paddingLeft).toBe('16px');
  },
};
