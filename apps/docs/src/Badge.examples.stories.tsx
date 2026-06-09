import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Badge',
  component: Badge,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    children: 'React',
    variant: 'neutral',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Brand: Story = { args: { variant: 'brand', children: 'Brand' } };
export const Success: Story = {
  args: { variant: 'success', children: 'Success' },
};
export const Warning: Story = {
  args: { variant: 'warning', children: 'Warning' },
};
export const Danger: Story = {
  args: { variant: 'danger', children: 'Failed' },
};
