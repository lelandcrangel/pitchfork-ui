import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table } from '@pitchfork-ui/react';

const columns = [
  { key: 'invoice', header: 'Invoice', width: 140, sortable: true },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'dueDate', header: 'Due date', sortable: true },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right' as const,
    sortable: true,
    sortValue: (row: Record<string, React.ReactNode>) => {
      const raw = String(row.amount ?? '').replace(/[$,]/g, '');
      return Number(raw) || 0;
    },
  },
  { key: 'status', header: 'Status', sortable: true },
];

const rows = [
  {
    invoice: 'INV-1043',
    customer: 'Acme Labs',
    dueDate: 'May 14, 2026',
    amount: '$2,440.00',
    status: 'Paid',
  },
  {
    invoice: 'INV-1042',
    customer: 'Northstar Health',
    dueDate: 'May 21, 2026',
    amount: '$9,150.00',
    status: 'Pending',
  },
  {
    invoice: 'INV-1041',
    customer: 'Solaris Group',
    dueDate: 'May 22, 2026',
    amount: '$1,290.00',
    status: 'Past due',
  },
  {
    invoice: 'INV-1040',
    customer: 'Parallel Works',
    dueDate: 'May 25, 2026',
    amount: '$3,620.00',
    status: 'Pending',
  },
  {
    invoice: 'INV-1039',
    customer: 'Borealis Ops',
    dueDate: 'May 29, 2026',
    amount: '$4,830.00',
    status: 'Paid',
  },
  {
    invoice: 'INV-1038',
    customer: 'Lumen Retail',
    dueDate: 'Jun 02, 2026',
    amount: '$7,010.00',
    status: 'Pending',
  },
  {
    invoice: 'INV-1037',
    customer: 'Vantage Co.',
    dueDate: 'Jun 05, 2026',
    amount: '$540.00',
    status: 'Paid',
  },
  {
    invoice: 'INV-1036',
    customer: 'Cinder Studio',
    dueDate: 'Jun 08, 2026',
    amount: '$3,005.00',
    status: 'Pending',
  },
];

const stickyTableStyle: React.CSSProperties = { maxHeight: 260 };

const columnsCode = `const columns = [
  { key: 'invoice', header: 'Invoice', width: 140, sortable: true },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'dueDate', header: 'Due date', sortable: true },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    sortable: true,
    sortValue: (row) => {
      const raw = String(row.amount ?? '').replace(/[$,]/g, '');
      return Number(raw) || 0;
    },
  },
  { key: 'status', header: 'Status', sortable: true },
];`;

const rowsCode = `const rows = [
  { invoice: 'INV-1043', customer: 'Acme Labs', dueDate: 'May 14, 2026', amount: '$2,440.00', status: 'Paid' },
  { invoice: 'INV-1042', customer: 'Northstar Health', dueDate: 'May 21, 2026', amount: '$9,150.00', status: 'Pending' },
  { invoice: 'INV-1041', customer: 'Solaris Group', dueDate: 'May 22, 2026', amount: '$1,290.00', status: 'Past due' },
  { invoice: 'INV-1040', customer: 'Parallel Works', dueDate: 'May 25, 2026', amount: '$3,620.00', status: 'Pending' },
  { invoice: 'INV-1039', customer: 'Borealis Ops', dueDate: 'May 29, 2026', amount: '$4,830.00', status: 'Paid' },
  { invoice: 'INV-1038', customer: 'Lumen Retail', dueDate: 'Jun 02, 2026', amount: '$7,010.00', status: 'Pending' },
  { invoice: 'INV-1037', customer: 'Vantage Co.', dueDate: 'Jun 05, 2026', amount: '$540.00', status: 'Paid' },
  { invoice: 'INV-1036', customer: 'Cinder Studio', dueDate: 'Jun 08, 2026', amount: '$3,005.00', status: 'Pending' },
];`;

const meta = {
  title: 'Examples/Table',
  component: Table,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { columns, rows },
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Table {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${columnsCode}
${rowsCode}

<Table columns={columns} rows={rows} />`,
      },
    },
  },
};

export const DenseStriped: Story = {
  args: { dense: true, striped: true },
  render: (args) => <Table {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${columnsCode}
${rowsCode}

<Table columns={columns} rows={rows} dense striped />`,
      },
    },
  },
};

export const WithCaption: Story = {
  args: { caption: 'Outstanding invoices for Q2 billing cycle.' },
  render: (args) => <Table {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${columnsCode}
${rowsCode}

<Table
  columns={columns}
  rows={rows}
  caption="Outstanding invoices for Q2 billing cycle."
/>`,
      },
    },
  },
};

export const StickyHeader: Story = {
  args: { stickyHeader: true, striped: true, style: stickyTableStyle },
  render: (args) => <Table {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${columnsCode}
${rowsCode}

const stickyTableStyle = { maxHeight: 260 };

<Table columns={columns} rows={rows} stickyHeader striped style={stickyTableStyle} />`,
      },
    },
  },
};

export const EmptyState: Story = {
  args: { rows: [], emptyState: 'No invoices were found for this filter set.' },
  render: (args) => <Table {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${columnsCode}

<Table
  columns={columns}
  rows={[]}
  emptyState="No invoices were found for this filter set."
/>`,
      },
    },
  },
};
