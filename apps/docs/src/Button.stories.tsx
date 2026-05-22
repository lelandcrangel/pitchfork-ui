import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Button',
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

export const Interactive: Story = {
  args: {
    children: 'Interactive button',
    variant: 'primary',
    size: 'md',
  },
};
