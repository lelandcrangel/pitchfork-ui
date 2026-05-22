import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Tag } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['ai-generated', 'test'],
  args: {
    children: 'Design',
    variant: 'neutral',
    dismissible: false,
    onDismiss: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['neutral', 'brand', 'success', 'warning'],
    },
    dismissible: { control: 'boolean' },
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Tag {...args} />,
};
