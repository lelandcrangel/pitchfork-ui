import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Rich Text Editor',
  component: RichTextEditor,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Description',
    description: 'Use formatting controls to style your text.',
    placeholder: 'Write product details...',
    minHeight: 160,
    characterMax: 220,
    defaultValue: '<p><strong>Pitchfork UI</strong> helps teams ship faster.</p>',
    disabled: false,
  },
  argTypes: {
    minHeight: { control: { type: 'number', min: 100, max: 400, step: 10 } },
    characterMax: { control: { type: 'number', min: 40, max: 500, step: 10 } },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof RichTextEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <RichTextEditor {...args} />,
};
