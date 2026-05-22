import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@pitchfork-ui/react';

const projectItems = [
  {
    value: 'roadmap',
    label: 'Roadmap',
    content: (
      <p style={{ margin: 0 }}>
        Prioritize milestones by customer impact and engineering confidence.
      </p>
    ),
  },
  {
    value: 'delivery',
    label: 'Delivery',
    content: (
      <p style={{ margin: 0 }}>
        Sprint completion is at 92% with two carry-over tickets this cycle.
      </p>
    ),
  },
  {
    value: 'risks',
    label: 'Risks',
    content: (
      <p style={{ margin: 0 }}>
        Primary risk is API response latency in peak traffic windows.
      </p>
    ),
  },
];

const compactItems = [
  {
    value: 'all',
    label: 'All',
    content: <p style={{ margin: 0 }}>Showing all notifications.</p>,
  },
  {
    value: 'mentions',
    label: 'Mentions',
    content: <p style={{ margin: 0 }}>Showing only mentions.</p>,
  },
  {
    value: 'alerts',
    label: 'Alerts',
    content: <p style={{ margin: 0 }}>Showing high-priority alerts.</p>,
  },
  {
    value: 'muted',
    label: 'Muted',
    content: <p style={{ margin: 0 }}>Showing muted threads.</p>,
  },
];

const meta = {
  title: 'Examples/Tabs',
  component: Tabs,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    items: projectItems,
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Underline: Story = {};

export const Pills: Story = {
  args: {
    variant: 'pills',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    variant: 'pills',
  },
};

export const CompactSmall: Story = {
  args: {
    items: compactItems,
    size: 'sm',
  },
};
