import type { Meta, StoryObj } from '@storybook/react-vite';
import { VisuallyHidden } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/VisuallyHidden',
  component: VisuallyHidden,
  tags: ['ai-generated', 'test'],
  args: {
    children: 'This text is announced by screen readers but hidden visually.',
    focusable: false,
  },
  argTypes: {
    as: { control: 'select', options: ['span', 'div', 'p', 'label'] },
    focusable: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <p style={{ margin: 0 }}>
      There is a visually hidden message right here →
      <VisuallyHidden {...args} />← (inspect the DOM or use a screen reader to find it).
    </p>
  ),
};
