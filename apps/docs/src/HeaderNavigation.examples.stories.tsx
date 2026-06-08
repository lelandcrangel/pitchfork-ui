import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  HeaderNavigation,
  Icon,
  UtilityButton,
  type HeaderNavigationItem,
} from '@pitchfork-ui/react';

const defaultItems: HeaderNavigationItem[] = [
  { label: 'Overview', href: '#', active: true },
  { label: 'Projects', href: '#' },
  { label: 'Team', href: '#' },
  { label: 'Settings', href: '#' },
];

const workspaceItems: HeaderNavigationItem[] = [
  { label: 'Home', href: '#', active: true },
  { label: 'Activity', href: '#' },
  { label: 'Files', href: '#' },
];

const dashboardItems: HeaderNavigationItem[] = [
  { label: 'Overview', href: '#', active: true },
  { label: 'Analytics', href: '#' },
  { label: 'Billing', href: '#' },
];

const defaultActions = <Button size="sm">New</Button>;

const actionGroupActions = (
  <>
    <UtilityButton aria-label="Search">
      <Icon name="circle-question" aria-hidden />
    </UtilityButton>
    <Button size="sm" variant="secondary">
      Invite
    </Button>
  </>
);

const meta = {
  title: 'Examples/HeaderNavigation',
  component: HeaderNavigation,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { items: [] },
} satisfies Meta<typeof HeaderNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HeaderNavigation brand="Pitchfork UI" items={defaultItems} actions={defaultActions} />
  ),
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Overview', href: '#', active: true },
  { label: 'Projects', href: '#' },
  { label: 'Team', href: '#' },
  { label: 'Settings', href: '#' },
];

<HeaderNavigation
  brand="Pitchfork UI"
  items={items}
  actions={<Button size="sm">New</Button>}
/>`,
      },
    },
  },
};

export const NoActions: Story = {
  render: () => <HeaderNavigation brand="Workspace" items={workspaceItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Home', href: '#', active: true },
  { label: 'Activity', href: '#' },
  { label: 'Files', href: '#' },
];

<HeaderNavigation brand="Workspace" items={items} />`,
      },
    },
  },
};

export const ActionGroup: Story = {
  render: () => (
    <HeaderNavigation brand="Dashboard" items={dashboardItems} actions={actionGroupActions} />
  ),
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { label: 'Overview', href: '#', active: true },
  { label: 'Analytics', href: '#' },
  { label: 'Billing', href: '#' },
];

<HeaderNavigation
  brand="Dashboard"
  items={items}
  actions={
    <>
      <UtilityButton aria-label="Search">
        <Icon name="circle-question" aria-hidden />
      </UtilityButton>
      <Button size="sm" variant="secondary">Invite</Button>
    </>
  }
/>`,
      },
    },
  },
};
