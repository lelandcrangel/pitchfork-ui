import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, Timeline, type TimelineItem } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Timeline',
  component: Timeline,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { items: [] },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

const activity: TimelineItem[] = [
  {
    id: '1',
    title: 'Order placed',
    description: 'Order #1024 confirmed.',
    timestamp: '9:00 AM',
    tone: 'success',
  },
  { id: '2', title: 'Packed', description: 'Items prepared for shipping.', timestamp: '11:20 AM' },
  {
    id: '3',
    title: 'Shipped',
    description: 'Handed to the carrier.',
    timestamp: '2:30 PM',
    tone: 'default',
  },
  { id: '4', title: 'Out for delivery', timestamp: 'Tomorrow', tone: 'warning' },
];

const activityCode = `const activity = [
  { id: '1', title: 'Order placed', description: 'Order #1024 confirmed.', timestamp: '9:00 AM', tone: 'success' },
  { id: '2', title: 'Packed', description: 'Items prepared for shipping.', timestamp: '11:20 AM' },
  { id: '3', title: 'Shipped', description: 'Handed to the carrier.', timestamp: '2:30 PM', tone: 'default' },
  { id: '4', title: 'Out for delivery', timestamp: 'Tomorrow', tone: 'warning' },
];`;

export const Default: Story = {
  render: () => <Timeline items={activity} />,
  parameters: {
    docs: {
      source: {
        code: `${activityCode}

<Timeline items={activity} />`,
      },
    },
  },
};

const withIcons: TimelineItem[] = [
  {
    id: '1',
    title: 'Approved',
    timestamp: 'Mon',
    tone: 'success',
    icon: <Icon name="circle-check" aria-hidden />,
  },
  {
    id: '2',
    title: 'In review',
    timestamp: 'Tue',
    tone: 'warning',
    icon: <Icon name="circle-info" aria-hidden />,
  },
  {
    id: '3',
    title: 'Rejected',
    timestamp: 'Wed',
    tone: 'danger',
    icon: <Icon name="circle-xmark" aria-hidden />,
  },
];

const withIconsCode = `const withIcons = [
  { id: '1', title: 'Approved', timestamp: 'Mon', tone: 'success', icon: <Icon name="circle-check" aria-hidden /> },
  { id: '2', title: 'In review', timestamp: 'Tue', tone: 'warning', icon: <Icon name="circle-info" aria-hidden /> },
  { id: '3', title: 'Rejected', timestamp: 'Wed', tone: 'danger', icon: <Icon name="circle-xmark" aria-hidden /> },
];`;

export const WithIcons: Story = {
  name: 'With marker icons',
  render: () => <Timeline items={withIcons} />,
  parameters: {
    docs: {
      source: {
        code: `${withIconsCode}

<Timeline items={withIcons} />`,
      },
    },
  },
};

const minimal: TimelineItem[] = [
  { id: '1', title: 'Created the project' },
  { id: '2', title: 'Invited 3 collaborators' },
  { id: '3', title: 'Published v1.0' },
];

const minimalCode = `const minimal = [
  { id: '1', title: 'Created the project' },
  { id: '2', title: 'Invited 3 collaborators' },
  { id: '3', title: 'Published v1.0' },
];`;

export const Minimal: Story = {
  name: 'Titles only',
  render: () => <Timeline items={minimal} aria-label="Project history" />,
  parameters: {
    docs: {
      source: {
        code: `${minimalCode}

<Timeline items={minimal} aria-label="Project history" />`,
      },
    },
  },
};
