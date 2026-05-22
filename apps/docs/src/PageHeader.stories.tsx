import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, PageHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Page Headers',
  component: PageHeader,
  tags: ['ai-generated', 'test'],
  args: {
    eyebrow: 'Overview',
    heading: 'Analytics workspace',
    description:
      'Monitor team activity, exports, and performance from a single view.',
    breadcrumbs: [
      { label: 'Home', href: '#' },
      { label: 'Workspace', href: '#' },
      { label: 'Analytics', current: true },
    ],
    metadata: <Badge variant="brand">Live</Badge>,
    actions: <Button size="sm">New report</Button>,
  },
  argTypes: {
    metadata: { control: false },
    actions: { control: false },
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <PageHeader {...args} />,
};
