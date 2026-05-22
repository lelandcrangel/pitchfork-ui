import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Textarea',
  component: Textarea,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Description',
    placeholder: 'Write a short project description...',
    description: 'Keep it concise and specific.',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive textarea',
    placeholder: 'Type details here',
    description: 'Edit this field with controls.',
  },
};
