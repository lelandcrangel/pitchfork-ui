import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, EmptyState } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/EmptyState',
  component: EmptyState,
  args: {
    heading: 'Nothing here yet',
    description: 'Add something to get started.',
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
    iconName: { control: 'text' },
    heading: { control: 'text' },
    description: { control: 'text' },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <EmptyState
      {...args}
      action={<Button size="sm">Get started</Button>}
    />
  ),
};
