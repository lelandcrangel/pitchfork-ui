import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, CommandPalette, type CommandItem } from '@pitchfork-ui/react';

const items: CommandItem[] = [
  {
    id: 'new-file',
    label: 'New file',
    description: 'Create a new file',
    group: 'File',
    onSelect: () => alert('New file'),
  },
  {
    id: 'open-file',
    label: 'Open file',
    description: 'Open an existing file',
    group: 'File',
    onSelect: () => alert('Open file'),
  },
  {
    id: 'save-file',
    label: 'Save',
    description: 'Save the current file',
    group: 'File',
    onSelect: () => alert('Save'),
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Open app settings',
    group: 'App',
    onSelect: () => alert('Settings'),
  },
  {
    id: 'theme',
    label: 'Toggle theme',
    description: 'Switch light / dark mode',
    group: 'App',
    onSelect: () => alert('Toggle theme'),
  },
  {
    id: 'docs',
    label: 'Open docs',
    description: 'View component docs',
    group: 'Help',
    onSelect: () => alert('Docs'),
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

const meta = {
  title: 'Components/CommandPalette',
  component: CommandPalette,
  tags: ['ai-generated', 'test'],
  args: {
    items,
    placeholder: 'Search commands…',
    emptyMessage: 'No results found.',
  },
  argTypes: {
    placeholder: { control: 'text' },
    emptyMessage: { control: 'text' },
  },
} satisfies Meta<typeof CommandPalette>;

export default meta;
type Story = StoryObj<typeof meta>;

function InteractiveDemo(args: React.ComponentProps<typeof CommandPalette>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open command palette</Button>
      <CommandPalette {...args} open={open} onOpenChange={setOpen} />
    </>
  );
}

export const Interactive: Story = {
  args: {
    open: false,
    onOpenChange: () => {},
  },
  render: (args) => <InteractiveDemo {...args} />,
};
