import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs, type TabsItem } from '@pitchfork-ui/react';

const pStyle: React.CSSProperties = { margin: 0 };

const projectItems: TabsItem[] = [
  {
    value: 'roadmap',
    label: 'Roadmap',
    content: (
      <p style={pStyle}>Prioritize milestones by customer impact and engineering confidence.</p>
    ),
  },
  {
    value: 'delivery',
    label: 'Delivery',
    content: (
      <p style={pStyle}>Sprint completion is at 92% with two carry-over tickets this cycle.</p>
    ),
  },
  {
    value: 'risks',
    label: 'Risks',
    content: <p style={pStyle}>Primary risk is API response latency in peak traffic windows.</p>,
  },
];

const compactItems: TabsItem[] = [
  { value: 'all', label: 'All', content: <p style={pStyle}>Showing all notifications.</p> },
  { value: 'mentions', label: 'Mentions', content: <p style={pStyle}>Showing only mentions.</p> },
  {
    value: 'alerts',
    label: 'Alerts',
    content: <p style={pStyle}>Showing high-priority alerts.</p>,
  },
  { value: 'muted', label: 'Muted', content: <p style={pStyle}>Showing muted threads.</p> },
];

const projectItemsCode = `const items = [
  {
    value: 'roadmap',
    label: 'Roadmap',
    content: <p>Prioritize milestones by customer impact and engineering confidence.</p>,
  },
  {
    value: 'delivery',
    label: 'Delivery',
    content: <p>Sprint completion is at 92% with two carry-over tickets this cycle.</p>,
  },
  {
    value: 'risks',
    label: 'Risks',
    content: <p>Primary risk is API response latency in peak traffic windows.</p>,
  },
];`;

const compactItemsCode = `const items = [
  { value: 'all', label: 'All', content: <p>Showing all notifications.</p> },
  { value: 'mentions', label: 'Mentions', content: <p>Showing only mentions.</p> },
  { value: 'alerts', label: 'Alerts', content: <p>Showing high-priority alerts.</p> },
  { value: 'muted', label: 'Muted', content: <p>Showing muted threads.</p> },
];`;

const meta = {
  title: 'Examples/Tabs',
  component: Tabs,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { items: projectItems },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Underline: Story = {
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${projectItemsCode}

<Tabs items={items} />`,
      },
    },
  },
};

export const Pills: Story = {
  args: { variant: 'pills' },
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${projectItemsCode}

<Tabs items={items} variant="pills" />`,
      },
    },
  },
};

export const FullWidth: Story = {
  args: { fullWidth: true, variant: 'pills' },
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${projectItemsCode}

<Tabs items={items} variant="pills" fullWidth />`,
      },
    },
  },
};

export const CompactSmall: Story = {
  args: { items: compactItems, size: 'sm' },
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${compactItemsCode}

<Tabs items={items} size="sm" />`,
      },
    },
  },
};
