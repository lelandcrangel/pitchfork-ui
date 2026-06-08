import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMemo, useState } from 'react';
import { Badge, type BadgeVariant, Input, Pagination, Select, Table } from '@pitchfork-ui/react';

const meta = {
  title: 'Patterns/Data Table',
  tags: ['test'],
} satisfies Meta;

export default meta;
type Story = StoryObj;

type InvoiceStatus = 'paid' | 'pending' | 'overdue';

interface Invoice {
  invoice: string;
  customer: string;
  amount: number;
  status: InvoiceStatus;
}

const allInvoices: Invoice[] = [
  { invoice: 'INV-1043', customer: 'Acme Labs', amount: 2440, status: 'paid' },
  { invoice: 'INV-1042', customer: 'Northstar Health', amount: 9150, status: 'pending' },
  { invoice: 'INV-1041', customer: 'Solaris Group', amount: 1290, status: 'overdue' },
  { invoice: 'INV-1040', customer: 'Parallel Works', amount: 3620, status: 'pending' },
  { invoice: 'INV-1039', customer: 'Borealis Ops', amount: 4830, status: 'paid' },
  { invoice: 'INV-1038', customer: 'Lumen Retail', amount: 7010, status: 'pending' },
  { invoice: 'INV-1037', customer: 'Vantage Co.', amount: 540, status: 'paid' },
  { invoice: 'INV-1036', customer: 'Cinder Studio', amount: 3005, status: 'overdue' },
  { invoice: 'INV-1035', customer: 'Quartz Media', amount: 1875, status: 'paid' },
  { invoice: 'INV-1034', customer: 'Halcyon Inc', amount: 6240, status: 'pending' },
];

const statusMeta: Record<InvoiceStatus, { label: string; variant: BadgeVariant }> = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'brand' },
  overdue: { label: 'Overdue', variant: 'warning' },
};

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
];

const columns = [
  { key: 'invoice', header: 'Invoice', sortable: true },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'amount', header: 'Amount', align: 'right' as const, sortable: true },
  { key: 'status', header: 'Status' },
];

const PAGE_SIZE = 4;

const wrapStyle: React.CSSProperties = { maxWidth: 760, width: '100%' };
const toolbarStyle: React.CSSProperties = {
  // auto-fit stacks the search + filter into one column below ~360px
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
  alignItems: 'end',
  marginBottom: 16,
};
const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 16,
};
const mutedStyle: React.CSSProperties = {
  color: 'var(--color-semantic-text-muted)',
  fontSize: '0.875rem',
};

function DataTableDemo() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allInvoices.filter((row) => {
      const matchesQuery =
        !q || row.invoice.toLowerCase().includes(q) || row.customer.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const rows = pageRows.map((row) => ({
    invoice: row.invoice,
    customer: row.customer,
    amount: `$${row.amount.toLocaleString()}`,
    status: <Badge variant={statusMeta[row.status].variant}>{statusMeta[row.status].label}</Badge>,
  }));

  return (
    <div style={wrapStyle}>
      <div style={toolbarStyle}>
        <Input
          label="Search"
          placeholder="Search invoices or customers"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label="Status"
          options={statusOptions}
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>

      <Table columns={columns} rows={rows} emptyState="No invoices match your filters." />

      <div style={footerStyle}>
        <span style={mutedStyle}>
          {filtered.length} {filtered.length === 1 ? 'invoice' : 'invoices'}
        </span>
        <Pagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}

export const Default: Story = {
  name: 'Data table',
  render: () => <DataTableDemo />,
  parameters: {
    docs: {
      source: {
        code: `const statusMeta = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'brand' },
  overdue: { label: 'Overdue', variant: 'warning' },
};

const columns = [
  { key: 'invoice', header: 'Invoice', sortable: true },
  { key: 'customer', header: 'Customer', sortable: true },
  { key: 'amount', header: 'Amount', align: 'right', sortable: true },
  { key: 'status', header: 'Status' },
];

function DataTableDemo() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = invoices.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || row.invoice.toLowerCase().includes(q) || row.customer.toLowerCase().includes(q);
    return matchesQuery && (status === 'all' || row.status === status);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / 4));
  const pageRows = filtered.slice((page - 1) * 4, page * 4);

  const rows = pageRows.map((row) => ({
    invoice: row.invoice,
    customer: row.customer,
    amount: \`$\${row.amount.toLocaleString()}\`,
    status: <Badge variant={statusMeta[row.status].variant}>{statusMeta[row.status].label}</Badge>,
  }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Input label="Search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
        <Select label="Status" options={statusOptions} value={status} onValueChange={(v) => { setStatus(v); setPage(1); }} />
      </div>
      <Table columns={columns} rows={rows} emptyState="No invoices match your filters." />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}`,
      },
    },
  },
};
