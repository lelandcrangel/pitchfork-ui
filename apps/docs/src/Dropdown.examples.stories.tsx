import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown, Icon, type DropdownItem } from '@pitchfork-ui/react';

const actionItems: DropdownItem[] = [
  { label: 'Profile', icon: <Icon name="circle-check" aria-hidden /> },
  { label: 'Settings', icon: <Icon name="copy" aria-hidden /> },
  { label: 'Delete', icon: <Icon name="circle-xmark" aria-hidden />, destructive: true },
];

const shortcutItems: DropdownItem[] = [
  { label: 'Rename', shortcut: 'R' },
  { label: 'Duplicate', shortcut: 'D' },
  { label: 'Archive', shortcut: 'A' },
];

const manageItems: DropdownItem[] = [
  { label: 'Edit' },
  { label: 'Share' },
  { label: 'Delete', destructive: true, disabled: true },
];

const meta = {
  title: 'Examples/Dropdown',
  component: Dropdown,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <Dropdown label="Actions" items={actionItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Profile', icon: <Icon name="circle-check" aria-hidden /> },
  { label: 'Settings', icon: <Icon name="copy" aria-hidden /> },
  { label: 'Delete', icon: <Icon name="circle-xmark" aria-hidden />, destructive: true },
];

<Dropdown label="Actions" items={items} />`,
      },
    },
  },
};

export const EndAligned: Story = {
  render: () => <Dropdown label="More" align="end" items={shortcutItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Rename', shortcut: 'R' },
  { label: 'Duplicate', shortcut: 'D' },
  { label: 'Archive', shortcut: 'A' },
];

<Dropdown label="More" align="end" items={items} />`,
      },
    },
  },
};

export const WithDisabledItem: Story = {
  render: () => <Dropdown label="Manage" items={manageItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Edit' },
  { label: 'Share' },
  { label: 'Delete', destructive: true, disabled: true },
];

<Dropdown label="Manage" items={items} />`,
      },
    },
  },
};
