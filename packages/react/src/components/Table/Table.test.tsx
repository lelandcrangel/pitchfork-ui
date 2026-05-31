import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Table } from './Table';

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
  { key: 'role', header: 'Role' },
];

const rows = [
  { name: 'Alice', age: 32, role: 'Engineer' },
  { name: 'Bob', age: 25, role: 'Designer' },
  { name: 'Carol', age: 28, role: 'Manager' },
];

describe('Table', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────

  it('renders a table with column headers', () => {
    render(<Table columns={columns} rows={rows} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Age' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Role' })).toBeInTheDocument();
  });

  it('renders a row for each data item', () => {
    render(<Table columns={columns} rows={rows} />);
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1); // +1 for header
  });

  it('renders cell values from row data', () => {
    render(<Table columns={columns} rows={rows} />);
    expect(screen.getByRole('cell', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Engineer' })).toBeInTheDocument();
  });

  it('renders a fallback em-dash for missing cell values', () => {
    render(<Table columns={columns} rows={[{ name: 'Alice' }]} />);
    const cells = screen.getAllByRole('cell', { name: '—' });
    expect(cells.length).toBeGreaterThan(0);
  });

  it('renders a caption when provided', () => {
    render(<Table columns={columns} rows={rows} caption="User list" />);
    expect(screen.getByText('User list')).toBeInTheDocument();
  });

  // ─── Empty state ─────────────────────────────────────────────────────────

  it('shows the default empty state when rows is empty', () => {
    render(<Table columns={columns} rows={[]} />);
    expect(screen.getByText('No data available.')).toBeInTheDocument();
  });

  it('shows a custom empty state message', () => {
    render(<Table columns={columns} rows={[]} emptyState="Nothing here yet." />);
    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument();
  });

  it('spans all columns in the empty state row', () => {
    render(<Table columns={columns} rows={[]} />);
    const emptyCell = screen.getByRole('cell', { name: 'No data available.' });
    expect(emptyCell).toHaveAttribute('colspan', String(columns.length));
  });

  // ─── Sorting ─────────────────────────────────────────────────────────────

  it('renders sort buttons on sortable columns', () => {
    render(<Table columns={columns} rows={rows} />);
    // Name and Age have sortable=true, Role does not
    expect(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button')).toBeInTheDocument();
    expect(within(screen.getByRole('columnheader', { name: /Age/ })).getByRole('button')).toBeInTheDocument();
    expect(within(screen.getByRole('columnheader', { name: 'Role' })).queryByRole('button')).not.toBeInTheDocument();
  });

  it('sets aria-sort=none on unsorted sortable columns', () => {
    render(<Table columns={columns} rows={rows} />);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'none');
  });

  it('sorts ascending on first click and sets aria-sort=ascending', async () => {
    const user = userEvent.setup();
    render(<Table columns={columns} rows={rows} />);
    await user.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
    const cells = screen.getAllByRole('cell', { name: /Alice|Bob|Carol/ });
    expect(cells[0]).toHaveTextContent('Alice');
    expect(cells[1]).toHaveTextContent('Bob');
    expect(cells[2]).toHaveTextContent('Carol');
  });

  it('toggles to descending on second click', async () => {
    const user = userEvent.setup();
    render(<Table columns={columns} rows={rows} />);
    const sortBtn = within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button');
    await user.click(sortBtn);
    await user.click(sortBtn);
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'descending');
    const cells = screen.getAllByRole('cell', { name: /Alice|Bob|Carol/ });
    expect(cells[0]).toHaveTextContent('Carol');
    expect(cells[2]).toHaveTextContent('Alice');
  });

  it('calls onSortStateChange when a sortable header is clicked', async () => {
    const user = userEvent.setup();
    const onSortStateChange = vi.fn();
    render(<Table columns={columns} rows={rows} onSortStateChange={onSortStateChange} />);
    await user.click(within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'));
    expect(onSortStateChange).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
  });

  it('reflects a controlled sort state', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        sortState={{ key: 'age', direction: 'desc' }}
        onSortStateChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /Age/ })).toHaveAttribute('aria-sort', 'descending');
  });

  it('applies a defaultSortState on first render', () => {
    render(
      <Table
        columns={columns}
        rows={rows}
        defaultSortState={{ key: 'name', direction: 'asc' }}
      />,
    );
    expect(screen.getByRole('columnheader', { name: /Name/ })).toHaveAttribute('aria-sort', 'ascending');
  });

  // ─── Modifier classes ────────────────────────────────────────────────────

  it('applies the dense class', () => {
    render(<Table columns={columns} rows={rows} dense />);
    expect(document.querySelector('.pf-table--dense')).toBeInTheDocument();
  });

  it('applies the striped class', () => {
    render(<Table columns={columns} rows={rows} striped />);
    expect(document.querySelector('.pf-table--striped')).toBeInTheDocument();
  });

  it('does not apply hoverable class when hoverable is false', () => {
    render(<Table columns={columns} rows={rows} hoverable={false} />);
    expect(document.querySelector('.pf-table--hoverable')).not.toBeInTheDocument();
  });
});
