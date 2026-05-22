import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, HeaderNavigation } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/HeaderNavigation',
  component: HeaderNavigation,
  tags: ['ai-generated', 'test'],
  args: {
    brand: 'Pitchfork UI',
    items: [
      { label: 'Overview', href: '#', active: true },
      { label: 'Projects', href: '#' },
      { label: 'Team', href: '#' },
      { label: 'Settings', href: '#' },
    ],
    actions: <Button size="sm">Create project</Button>,
  },
  argTypes: {
    items: { control: false },
    actions: { control: false },
    brand: { control: 'text' },
  },
} satisfies Meta<typeof HeaderNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <HeaderNavigation {...args} />,
};
