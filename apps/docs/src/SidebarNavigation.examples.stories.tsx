import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, SidebarNavigation, type SidebarNavigationSection } from '@pitchfork-ui/react';

const defaultSections: SidebarNavigationSection[] = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', active: true },
      { label: 'Notifications', badge: <Badge>4</Badge> },
      { label: 'Analytics' },
    ],
  },
  {
    title: 'Management',
    items: [{ label: 'Members' }, { label: 'Teams' }, { label: 'Permissions' }],
  },
];

const disabledSections: SidebarNavigationSection[] = [
  {
    title: 'Navigation',
    items: [
      { label: 'Home', active: true },
      { label: 'Reports' },
      { label: 'Audit log', disabled: true },
      { label: 'Security', disabled: true },
    ],
  },
];

const minimalSections: SidebarNavigationSection[] = [
  {
    items: [{ label: 'Overview', active: true }, { label: 'Updates' }, { label: 'Help' }],
  },
];

const placeholderSections: SidebarNavigationSection[] = [{ items: [{ label: 'Item' }] }];

const meta = {
  title: 'Examples/Sidebar Navigation',
  component: SidebarNavigation,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    sections: placeholderSections,
  },
} satisfies Meta<typeof SidebarNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SidebarNavigation header="Acme Inc" sections={defaultSections} footer="Plan: Growth" />
  ),
  parameters: {
    docs: {
      source: {
        code: `const defaultSections = [
  {
    title: 'General',
    items: [
      { label: 'Dashboard', active: true },
      { label: 'Notifications', badge: <Badge>4</Badge> },
      { label: 'Analytics' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Members' },
      { label: 'Teams' },
      { label: 'Permissions' },
    ],
  },
];

<SidebarNavigation header="Acme Inc" sections={defaultSections} footer="Plan: Growth" />`,
      },
    },
  },
};

export const WithDisabledItems: Story = {
  render: () => <SidebarNavigation sections={disabledSections} />,
  parameters: {
    docs: {
      source: {
        code: `const disabledSections = [
  {
    title: 'Navigation',
    items: [
      { label: 'Home', active: true },
      { label: 'Reports' },
      { label: 'Audit log', disabled: true },
      { label: 'Security', disabled: true },
    ],
  },
];

<SidebarNavigation sections={disabledSections} />`,
      },
    },
  },
};

export const Minimal: Story = {
  render: () => <SidebarNavigation sections={minimalSections} />,
  parameters: {
    docs: {
      source: {
        code: `const minimalSections = [
  {
    items: [
      { label: 'Overview', active: true },
      { label: 'Updates' },
      { label: 'Help' },
    ],
  },
];

<SidebarNavigation sections={minimalSections} />`,
      },
    },
  },
};
