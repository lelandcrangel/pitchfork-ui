import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, type ContextMenuEntry } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/ContextMenu',
  component: ContextMenu,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { items: [] },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

const target: React.CSSProperties = {
  alignItems: 'center',
  border: '1px dashed var(--color-semantic-border-strong)',
  borderRadius: 8,
  color: 'var(--color-semantic-text-muted)',
  display: 'flex',
  height: 140,
  justifyContent: 'center',
  userSelect: 'none',
};

const items: ContextMenuEntry[] = [
  { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: () => {} },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: () => {} },
  { separator: true },
  { id: 'rename', label: 'Rename', onSelect: () => {} },
  { id: 'delete', label: 'Delete', destructive: true, onSelect: () => {} },
];

const itemsCode = `const items = [
  { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: handleCopy },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: handlePaste },
  { separator: true },
  { id: 'rename', label: 'Rename', onSelect: handleRename },
  { id: 'delete', label: 'Delete', destructive: true, onSelect: handleDelete },
];`;

export const Default: Story = {
  render: () => (
    <ContextMenu items={items}>
      <div style={target}>Right-click here</div>
    </ContextMenu>
  ),
  parameters: {
    docs: {
      source: {
        code: `${itemsCode}

<ContextMenu items={items}>
  <div>Right-click here</div>
</ContextMenu>`,
      },
    },
  },
};
