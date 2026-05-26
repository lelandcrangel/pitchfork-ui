import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@pitchfork-ui/react';

const items = [
  {
    value: 'overview',
    label: 'Overview',
    content: (
      <p style={{ margin: 0 }}>
        Track team health, delivery status, and KPIs from one place.
      </p>
    ),
  },
  {
    value: 'activity',
    label: 'Activity',
    content: (
      <p style={{ margin: 0 }}>
        Recent events include PR merges, deployments, and incident updates.
      </p>
    ),
  },
  {
    value: 'settings',
    label: 'Settings',
    content: (
      <p style={{ margin: 0 }}>
        Configure alerts, notification channels, and role permissions.
      </p>
    ),
  },
  {
    value: 'billing',
    label: 'Billing',
    disabled: true,
    content: (
      <p style={{ margin: 0 }}>Billing details are currently unavailable.</p>
    ),
  },
];

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['ai-generated', 'test'],
  args: {
    items,
    variant: 'underline',
    size: 'md',
    fullWidth: false,
    defaultValue: 'overview',
  },
  argTypes: {
    items: { control: 'object' },
    variant: {
      control: 'select',
      options: ['underline', 'pills'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
