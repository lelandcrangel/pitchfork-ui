import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  HeaderNavigation,
  Icon,
  UtilityButton,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/HeaderNavigation',
  component: HeaderNavigation,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof HeaderNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: 'Pitchfork UI',
    items: [
      { label: 'Overview', href: '#', active: true },
      { label: 'Projects', href: '#' },
      { label: 'Team', href: '#' },
      { label: 'Settings', href: '#' },
    ],
    actions: <Button size="sm">New</Button>,
  },
};

export const NoActions: Story = {
  args: {
    brand: 'Workspace',
    items: [
      { label: 'Home', href: '#', active: true },
      { label: 'Activity', href: '#' },
      { label: 'Files', href: '#' },
    ],
  },
};

export const ActionGroup: Story = {
  args: {
    brand: 'Dashboard',
    items: [
      { label: 'Overview', href: '#', active: true },
      { label: 'Analytics', href: '#' },
      { label: 'Billing', href: '#' },
    ],
    actions: (
      <>
        <UtilityButton aria-label="Search">
          <Icon name="circle-question" aria-hidden />
        </UtilityButton>
        <Button size="sm" variant="secondary">
          Invite
        </Button>
      </>
    ),
  },
};
