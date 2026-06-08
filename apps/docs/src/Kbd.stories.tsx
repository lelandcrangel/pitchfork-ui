import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Kbd',
  component: Kbd,
  tags: ['test'],
  args: {
    keys: ['⌘', 'K'],
    size: 'md',
    separator: '+',
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    separator: { control: 'text' },
  },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Kbd {...args} />,
};
