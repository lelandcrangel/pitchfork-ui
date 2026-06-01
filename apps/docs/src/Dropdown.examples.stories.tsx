import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown, Icon } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Dropdown',
  component: Dropdown,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    label: 'Actions',
    items: [
      { label: 'Profile', icon: <Icon name="circle-check" aria-hidden /> },
      { label: 'Settings', icon: <Icon name="copy" aria-hidden /> },
      {
        label: 'Delete',
        icon: <Icon name="circle-xmark" aria-hidden />,
        destructive: true,
      },
    ],
  },
};

export const EndAligned: Story = {
  args: {
    label: 'More',
    align: 'end',
    items: [
      { label: 'Rename', shortcut: 'R' },
      { label: 'Duplicate', shortcut: 'D' },
      { label: 'Archive', shortcut: 'A' },
    ],
  },
};

export const WithDisabledItem: Story = {
  args: {
    label: 'Manage',
    items: [
      { label: 'Edit' },
      { label: 'Share' },
      { label: 'Delete', destructive: true, disabled: true },
    ],
  },
};
