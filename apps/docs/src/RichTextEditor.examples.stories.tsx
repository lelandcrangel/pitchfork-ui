import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Rich Text Editor',
  component: RichTextEditor,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Description',
    description: 'Use formatting controls to style your text.',
    placeholder: 'Write product details...',
    minHeight: 160,
  },
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithStartingContent: Story = {
  args: {
    defaultValue:
      '<p><strong>Limited launch:</strong> Orders ship within 24 hours.</p><p>Includes free returns for 30 days.</p>',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: '<p>Editing is disabled for archived records.</p>',
  },
};

export const ErrorState: Story = {
  args: {
    error: 'Please add at least 40 characters.',
  },
};

export const CharacterLimit: Story = {
  args: {
    label: 'Product summary',
    description: 'Keep this concise so it fits in card layouts.',
    characterMax: 120,
    defaultValue: '<p>Compact, fast, and flexible UI primitives for modern teams.</p>',
  },
};
