import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from '@pitchfork-ui/react';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'role', header: 'Role', sortable: true },
  { key: 'status', header: 'Status', sortable: true },
  { key: 'location', header: 'Location', sortable: true },
  {
    key: 'revenue',
    header: 'Revenue',
    align: 'right' as const,
    sortable: true,
    sortValue: (row: Record<string, React.ReactNode>) => {
      const raw = String(row.revenue ?? '').replace(/[$,]/g, '');
      return Number(raw) || 0;
    },
  },
];

const rows = [
  {
    name: 'Olivia Rhye',
    role: 'Product Designer',
    status: 'Active',
    location: 'Austin, TX',
    revenue: '$124,000',
  },
  {
    name: 'Phoenix Baker',
    role: 'Frontend Engineer',
    status: 'Active',
    location: 'Seattle, WA',
    revenue: '$143,000',
  },
  {
    name: 'Lana Steiner',
    role: 'Engineering Manager',
    status: 'On leave',
    location: 'Denver, CO',
    revenue: '$167,000',
  },
  {
    name: 'Demi Wilkinson',
    role: 'Sales Lead',
    status: 'Active',
    location: 'Chicago, IL',
    revenue: '$118,000',
  },
  {
    name: 'Candice Wu',
    role: 'Customer Success',
    status: 'Inactive',
    location: 'Portland, OR',
    revenue: '$102,000',
  },
];

const meta = {
  title: 'Components/Tables',
  component: Table,
  tags: ['ai-generated', 'test'],
  args: {
    columns,
    rows,
    caption: 'Team performance snapshot for the current quarter.',
    dense: false,
    striped: false,
    hoverable: true,
    stickyHeader: false,
    defaultSortState: { key: 'name', direction: 'asc' as const },
  },
  argTypes: {
    columns: { control: 'object' },
    rows: { control: 'object' },
    emptyState: { control: 'text' },
  },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
