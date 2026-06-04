import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, PageHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Page Headers',
  component: PageHeader,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Projects',
    description: 'Track delivery, ownership, and recent activity across your organization.',
    actions: <Button size="sm">Create project</Button>,
  },
};

export const WithBreadcrumbsAndMeta: Story = {
  args: {
    eyebrow: 'Revenue',
    heading: 'Q2 growth report',
    description: 'Review top-line performance and compare against targets.',
    breadcrumbs: [
      { label: 'Reports', href: '#' },
      { label: 'Finance', href: '#' },
      { label: 'Q2 growth report', current: true },
    ],
    metadata: (
      <>
        <Badge variant="success">Published</Badge>
        <span>Updated 2 hours ago</span>
      </>
    ),
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Share
        </Button>
        <Button size="sm">Export</Button>
      </>
    ),
  },
};

export const CompactMobileFriendly: Story = {
  args: {
    heading: 'Team settings',
    description: 'Manage members, roles, and permissions.',
    metadata: <span>24 members</span>,
  },
};
