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

const repoItems: TabsItem[] = [
  {
    value: 'overview',
    label: 'Overview',
    icon: 'chart-bar',
    content: <p style={pStyle}>Repository activity, contributors, and recent releases.</p>,
  },
  {
    value: 'issues',
    label: 'Issues',
    icon: 'circle-check',
    count: 12,
    content: <p style={pStyle}>12 open issues across 3 milestones.</p>,
  },
  {
    value: 'pulls',
    label: 'Pull requests',
    icon: 'copy',
    count: 4,
    content: <p style={pStyle}>4 pull requests awaiting review.</p>,
  },
  {
    value: 'stars',
    label: 'Stargazers',
    icon: 'star',
    count: 0,
    content: <p style={pStyle}>No stargazers yet — be the first.</p>,
  },
];

const repoItemsCode = `const items = [
  {
    value: 'overview',
    label: 'Overview',
    icon: 'chart-bar',
    content: <p>Repository activity, contributors, and recent releases.</p>,
  },
  {
    value: 'issues',
    label: 'Issues',
    icon: 'circle-check',
    count: 12,
    content: <p>12 open issues across 3 milestones.</p>,
  },
  {
    value: 'pulls',
    label: 'Pull requests',
    icon: 'copy',
    count: 4,
    content: <p>4 pull requests awaiting review.</p>,
  },
  {
    value: 'stars',
    label: 'Stargazers',
    icon: 'star',
    count: 0,
    content: <p>No stargazers yet — be the first.</p>,
  },
];`;

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

export const IconsAndCounts: Story = {
  args: { items: repoItems, defaultValue: 'issues' },
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${repoItemsCode}

<Tabs items={items} defaultValue="issues" />`,
      },
    },
  },
};

export const IconsAndCountsPills: Story = {
  args: { items: repoItems, variant: 'pills', defaultValue: 'issues' },
  render: (args) => <Tabs {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${repoItemsCode}

<Tabs items={items} variant="pills" defaultValue="issues" />`,
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
