import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Email address',
    placeholder: 'you@example.com',
    description: 'We will never share your email.',
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive input',
    placeholder: 'Type here',
    description: 'Edit this input with controls.',
  },
};
