import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['ai-generated', 'test'],
  args: {
    children: 'React',
    variant: 'neutral',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    children: 'Interactive badge',
    variant: 'neutral',
  },
};
