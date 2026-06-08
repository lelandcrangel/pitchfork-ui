import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, CommandPalette, type CommandItem } from '@pitchfork-ui/react';

const items: CommandItem[] = [
  {
    id: 'new-file',
    label: 'New file',
    description: 'Create a new file',
    group: 'File',
    onSelect: () => {},
  },
  {
    id: 'open-file',
    label: 'Open file',
    description: 'Open an existing file',
    group: 'File',
    onSelect: () => {},
  },
  {
    id: 'save-file',
    label: 'Save',
    description: 'Save the current file',
    group: 'File',
    onSelect: () => {},
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open app settings',
    group: 'App',
    onSelect: () => {},
  },
  {
    id: 'theme',
    label: 'Toggle theme',
    description: 'Switch light / dark mode',
    group: 'App',
    onSelect: () => {},
  },
  {
    id: 'docs',
    label: 'Open docs',
    description: 'View component docs',
    group: 'Help',
    onSelect: () => {},
  },
  {
    id: 'disabled',
    label: 'Premium feature',
    description: 'Upgrade to unlock',
    group: 'Help',
    onSelect: () => {},
    disabled: true,
  },
];

const itemsCode = `const items: CommandItem[] = [
  { id: 'new-file',  label: 'New file',      description: 'Create a new file',     group: 'File', onSelect: () => {} },
  { id: 'open-file', label: 'Open file',     description: 'Open an existing file', group: 'File', onSelect: () => {} },
  { id: 'settings',  label: 'Settings',      description: 'Open app settings',     group: 'App',  onSelect: () => {} },
  { id: 'docs',      label: 'Open docs',     description: 'View component docs',   group: 'Help', onSelect: () => {} },
];`;

const meta = {
  title: 'Examples/CommandPalette',
  component: CommandPalette,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

function Trigger({ label = 'Open command palette' }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{label}</Button>
      <CommandPalette items={items} open={open} onOpenChange={setOpen} />
    </>
  );
}

const stubArgs = { open: false, onOpenChange: () => {}, items };

export const Default: Story = {
  args: stubArgs,
  render: () => <Trigger />,
  parameters: {
    docs: {
      source: {
        code: `${itemsCode}

function App() {
  const [open, setOpen] = useState(false);

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <CommandPalette items={items} open={open} onOpenChange={setOpen} />
    </>
  );
}`,
      },
    },
  },
};

function CustomPlaceholderDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <CommandPalette
        items={items}
        open={open}
        onOpenChange={setOpen}
        placeholder="Type a command or search…"
        emptyMessage="No commands match your search."
      />
    </>
  );
}

export const WithCustomPlaceholder: Story = {
  name: 'Custom placeholder',
  args: stubArgs,
  render: () => <CustomPlaceholderDemo />,
  parameters: {
    docs: {
      source: {
        code: `${itemsCode}

<CommandPalette
  items={items}
  open={open}
  onOpenChange={setOpen}
  placeholder="Type a command or search…"
  emptyMessage="No commands match your search."
/>`,
      },
    },
  },
};
