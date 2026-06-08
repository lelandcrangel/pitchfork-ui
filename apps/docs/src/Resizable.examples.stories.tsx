import type { Meta, StoryObj } from '@storybook/react-vite';
import { Resizable } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Resizable',
  component: Resizable,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { children: null },
} satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof meta>;

const panel: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: '100%',
  padding: 16,
  color: 'var(--color-semantic-text-muted)',
  background: 'var(--color-semantic-background-subtle)',
};

const frame: React.CSSProperties = {
  height: 240,
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 8,
  overflow: 'hidden',
};

export const Horizontal: Story = {
  render: () => (
    <Resizable style={frame} defaultSize={35} min={20} max={70}>
      <div style={panel}>Sidebar</div>
      <div style={panel}>Main content</div>
    </Resizable>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Resizable defaultSize={35} min={20} max={70}>
  <div>Sidebar</div>
  <div>Main content</div>
</Resizable>`,
      },
    },
  },
};

export const Vertical: Story = {
  render: () => (
    <Resizable orientation="vertical" style={frame} defaultSize={60} min={25} max={80}>
      <div style={panel}>Editor</div>
      <div style={panel}>Console</div>
    </Resizable>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Resizable orientation="vertical" defaultSize={60} min={25} max={80}>
  <div>Editor</div>
  <div>Console</div>
</Resizable>`,
      },
    },
  },
};
