import type { Meta, StoryObj } from '@storybook/react-vite';
import { Dropdown, Icon } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Dropdown',
  component: Dropdown,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Actions',
    align: 'start',
    items: [
      {
        label: 'Edit profile',
        shortcut: 'E',
        icon: <Icon name="pen-to-square" aria-hidden />,
      },
      { label: 'Archive', shortcut: 'A' },
      {
        label: 'Delete',
        destructive: true,
        icon: <Icon name="trash-can" aria-hidden />,
      },
    ],
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'end'],
    },
  },
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
