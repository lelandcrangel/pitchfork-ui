import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  tags: ['ai-generated', 'test'],
  args: {
    orientation: 'vertical',
    focusable: true,
    style: {
      maxHeight: 200,
      maxWidth: 320,
      border: '1px solid var(--color-semantic-border-default)',
      borderRadius: 8,
      padding: 12,
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['vertical', 'horizontal', 'both'] },
    focusable: { control: 'boolean' },
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const rowStyle: React.CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  borderRadius: 6,
  background: 'var(--color-semantic-background-subtle)',
  color: 'var(--color-semantic-text-default)',
};

export const Interactive: Story = {
  render: (args) => (
    <ScrollArea {...args}>
      <div style={{ display: 'grid', gap: 8 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i} style={rowStyle}>
            Row {i + 1} — scroll to see the styled scrollbar in action.
          </p>
        ))}
      </div>
    </ScrollArea>
  ),
};
