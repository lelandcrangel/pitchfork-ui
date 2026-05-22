import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, SectionHeader } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Section Header',
  component: SectionHeader,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    heading: 'Section title',
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Billing settings',
    description: 'Manage invoices, payment methods, and usage tiers.',
  },
};

export const WithActionsAndMeta: Story = {
  args: {
    eyebrow: 'Workspace',
    heading: 'Deployment settings',
    description: 'Control releases and environment-specific overrides.',
    metadata: (
      <>
        <Badge variant="success">Healthy</Badge>
        <span>Updated 10m ago</span>
      </>
    ),
    actions: (
      <>
        <Button size="sm" variant="secondary">
          View logs
        </Button>
        <Button size="sm">Deploy</Button>
      </>
    ),
    divider: true,
  },
};

export const EndAligned: Story = {
  args: {
    align: 'end',
    heading: 'Filters',
    actions: (
      <>
        <Button size="sm" variant="secondary">
          Reset
        </Button>
        <Button size="sm">Apply</Button>
      </>
    ),
  },
};
