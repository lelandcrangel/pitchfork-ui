import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Avatar',
  component: Avatar,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    name: 'Leland Rangel',
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};

export const WithImage: Story = {
  args: {
    src: 'avatar.jpeg',
    alt: 'Profile image',
    name: 'Pitchfork User',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Leland Rangel" size="sm" />
      <Avatar name="Leland Rangel" size="md" />
      <Avatar name="Leland Rangel" size="lg" />
      <Avatar name="Leland Rangel" size="xl" />
    </div>
  ),
};

export const PresenceStatus: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Avatar name="Online User" status="online" />
      <Avatar name="Away User" status="away" />
      <Avatar name="Busy User" status="busy" />
      <Avatar name="Offline User" status="offline" />
    </div>
  ),
};
