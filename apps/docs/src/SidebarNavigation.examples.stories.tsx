import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, SidebarNavigation } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Sidebar Navigation',
  component: SidebarNavigation,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    sections: [{ items: [{ label: 'Item' }] }],
  },
} satisfies Meta<typeof SidebarNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SidebarNavigation
      header="Acme Inc"
      sections={[
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
      ]}
      footer="Plan: Growth"
    />
  ),
};

export const WithDisabledItems: Story = {
  render: () => (
    <SidebarNavigation
      sections={[
        {
          title: 'Navigation',
          items: [
            { label: 'Home', active: true },
            { label: 'Reports' },
            { label: 'Audit log', disabled: true },
            { label: 'Security', disabled: true },
          ],
        },
      ]}
    />
  ),
};

export const Minimal: Story = {
  render: () => (
    <SidebarNavigation
      sections={[
        {
          items: [
            { label: 'Overview', active: true },
            { label: 'Updates' },
            { label: 'Help' },
          ],
        },
      ]}
    />
  ),
};
