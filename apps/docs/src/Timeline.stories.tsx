import type { Meta, StoryObj } from '@storybook/react-vite';
import { Timeline } from '@pitchfork-ui/react';

const items = [
  { id: 'a', title: 'Account created', timestamp: 'Jun 1', tone: 'success' as const },
  { id: 'b', title: 'Profile completed', description: 'Added avatar and bio.', timestamp: 'Jun 2' },
  {
    id: 'c',
    title: 'Plan upgraded',
    description: 'Switched to Pro.',
    timestamp: 'Jun 4',
    tone: 'default' as const,
  },
  {
    id: 'd',
    title: 'Payment failed',
    description: 'Card was declined.',
    timestamp: 'Jun 5',
    tone: 'danger' as const,
  },
];

const meta = {
  title: 'Components/Timeline',
  component: Timeline,
  tags: ['ai-generated', 'test'],
  args: { items },
  argTypes: {
    items: { control: 'object' },
  },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: { items },
};
