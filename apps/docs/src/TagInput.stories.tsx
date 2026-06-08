import type { Meta, StoryObj } from '@storybook/react-vite';
import { TagInput } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/TagInput',
  component: TagInput,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Tags',
    description: 'Press Enter or comma to add a tag.',
    placeholder: 'Add a tag…',
    tagVariant: 'neutral',
    allowDuplicates: false,
    disabled: false,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    error: { control: 'text' },
    max: { control: 'number' },
    allowDuplicates: { control: 'boolean' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    tagVariant: {
      control: 'inline-radio',
      options: ['neutral', 'brand', 'success', 'warning'],
    },
    onValueChange: { action: 'value changed' },
  },
} satisfies Meta<typeof TagInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive tag input',
    description: 'Type and press Enter; Backspace on an empty field removes the last tag.',
    defaultValue: ['react', 'design-system'],
  },
};
