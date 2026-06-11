import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  tags: ['ai-generated', 'test'],
  args: {
    name: 'John Smith',
    size: 'md',
    status: 'online',
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    status: {
      control: 'select',
      options: ['online', 'away', 'busy', 'offline'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
