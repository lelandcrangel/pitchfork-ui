import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, SectionHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Section Headers',
  component: SectionHeader,
  tags: ['ai-generated', 'test'],
  args: {
    eyebrow: 'Overview',
    heading: 'Team activity',
    description:
      'Review status, ownership, and delivery metrics for this section.',
    divider: true,
    align: 'between',
    metadata: <Badge variant="brand">Live</Badge>,
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Export
        </Button>
        <Button size="sm">Create report</Button>
      </>
    ),
  },
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'between', 'end'],
    },
    metadata: {
      control: 'select',
      options: ['live', 'healthy', 'none'],
      mapping: {
        live: <Badge variant="brand">Live</Badge>,
        healthy: (
          <>
            <Badge variant="success">Healthy</Badge>
            <span>Updated 10m ago</span>
          </>
        ),
        none: null,
      },
    },
    actions: {
      control: 'select',
      options: ['export-and-create', 'reset-and-apply', 'none'],
      mapping: {
        'export-and-create': (
          <>
            <Button size="sm" variant="secondary">
              Export
            </Button>
            <Button size="sm">Create report</Button>
          </>
        ),
        'reset-and-apply': (
          <>
            <Button size="sm" variant="secondary">
              Reset
            </Button>
            <Button size="sm">Apply</Button>
          </>
        ),
        none: null,
      },
    },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <SectionHeader {...args} />,
};
