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
    type: 'text',
    disabled: false,
    required: false,
  },
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    description: { control: 'text' },
    error: { control: 'text' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'search', 'tel', 'url', 'number'],
    },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    style: { control: 'object' },
    onChange: { action: 'changed' },
    value: { control: 'text' },
    defaultValue: { control: 'text' },
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
