import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContextMenu, type ContextMenuEntry } from '@pitchfork-ui/react';

const items: ContextMenuEntry[] = [
  { id: 'copy', label: 'Copy', shortcut: '⌘C', onSelect: () => alert('Copy') },
  { id: 'paste', label: 'Paste', shortcut: '⌘V', onSelect: () => alert('Paste') },
  { id: 'duplicate', label: 'Duplicate', onSelect: () => alert('Duplicate') },
  { separator: true },
  { id: 'rename', label: 'Rename', onSelect: () => alert('Rename') },
  { id: 'archive', label: 'Archive', disabled: true, onSelect: () => {} },
  { separator: true },
  {
    id: 'delete',
    label: 'Delete',
    destructive: true,
    shortcut: 'Del',
    onSelect: () => alert('Delete'),
  },
];

const target: React.CSSProperties = {
  alignItems: 'center',
  border: '1px dashed var(--color-semantic-border-strong)',
  borderRadius: 8,
  color: 'var(--color-semantic-text-muted)',
  display: 'flex',
  height: 160,
  justifyContent: 'center',
  userSelect: 'none',
};

const meta = {
  title: 'Components/ContextMenu',
  component: ContextMenu,
  tags: ['ai-generated', 'test'],
  args: { items },
  argTypes: {
    items: { control: 'object' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <ContextMenu {...args}>
      <div style={target}>Right-click anywhere in this area</div>
    </ContextMenu>
  ),
};
