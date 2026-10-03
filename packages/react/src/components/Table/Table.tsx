import {
  ariaSortFor,
  nextSortState,
  type SortDirection,
  type SortState,
  sortRowsBy,
  type SortValue,
} from '@pitchfork-ui/core';
import { useMemo, useState } from 'react';
import { cx } from '../../utils/cx';
import './Table.css';

export type TableAlignment = 'left' | 'center' | 'right';
export type TableRow = Record<string, React.ReactNode>;
export type TableSortDirection = SortDirection;

export type TableSortState = SortState;

export interface TableColumn {
  key: string;
  header: React.ReactNode;
  align?: TableAlignment;
  width?: number | string;
  className?: string;
  sortable?: boolean;
  sortValue?: (row: TableRow) => string | number | Date | null | undefined;
}

export interface TableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: TableColumn[];
  rows: TableRow[];
  caption?: React.ReactNode;
  dense?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  stickyHeader?: boolean;
  emptyState?: React.ReactNode;
  defaultSortState?: TableSortState;
  sortState?: TableSortState;
  onSortStateChange?: (state: TableSortState) => void;
  getRowKey?: (row: TableRow, index: number) => React.Key;
}

export function Table({
  className,
  columns,
  rows,
  caption,
  dense = false,
  striped = false,
  hoverable = true,
  stickyHeader = false,
  emptyState = 'No data available.',
  defaultSortState,
  sortState,
  onSortStateChange,
  getRowKey,
  ...props
}: TableProps) {
  const [internalSortState, setInternalSortState] = useState<TableSortState | undefined>(
    defaultSortState,
  );
  const resolvedSortState = sortState ?? internalSortState;

  /*
   * The comparison is core's, so a consumer sorting their own rows for
   * `<pf-table>` — which reports a sort rather than performing one, because
   * the rows are theirs — gets the same order. That includes the collation:
   * "Item 2" before "Item 10", case and accents ignored.
   */
  const sortedRows = useMemo(() => {
    if (!resolvedSortState) {
      return rows;
    }

    const sortColumn = columns.find((column) => column.key === resolvedSortState.key);
    if (!sortColumn || !sortColumn.sortable) {
      return rows;
    }

    const getValue = (row: TableRow): SortValue =>
      sortColumn.sortValue ? sortColumn.sortValue(row) : (row[sortColumn.key] as SortValue);

    return sortRowsBy(rows, getValue, resolvedSortState.direction);
  }, [columns, resolvedSortState, rows]);

  const setSort = (nextState: TableSortState) => {
    if (!sortState) {
      setInternalSortState(nextState);
    }
    onSortStateChange?.(nextState);
  };

  const toggleSort = (column: TableColumn) => {
    if (!column.sortable) {
      return;
    }

    // Core's: a new column starts ascending, and the current one turns round.
    setSort(nextSortState(resolvedSortState, column.key));
  };

  return (
    <div
      className={cx(
        'pf-table',
        dense && 'pf-table--dense',
        striped && 'pf-table--striped',
        hoverable && 'pf-table--hoverable',
        stickyHeader && 'pf-table--sticky-header',
        className,
      )}
      {...props}
    >
      {caption ? <div className="pf-table__caption">{caption}</div> : null}

      <table className="pf-table__native">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cx(
                  'pf-table__head-cell',
                  `pf-table__cell--${column.align ?? 'left'}`,
                  column.className,
                )}
                scope="col"
                aria-sort={ariaSortFor(resolvedSortState, column.key)}
                style={
                  column.width !== undefined
                    ? ({
                        '--pf-col-width':
                          typeof column.width === 'number' ? `${column.width}px` : column.width,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                {column.sortable ? (
                  <button
                    type="button"
                    className="pf-table__sort-button"
                    onClick={() => toggleSort(column)}
                  >
                    <span>{column.header}</span>
                    <span className="pf-table__sort-indicator" aria-hidden>
                      {resolvedSortState?.key === column.key
                        ? resolvedSortState.direction === 'asc'
                          ? '^'
                          : 'v'
                        : '-'}
                    </span>
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td className="pf-table__empty" colSpan={Math.max(columns.length, 1)}>
                {emptyState}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, rowIndex) => (
              <tr key={getRowKey?.(row, rowIndex) ?? rowIndex}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cx(
                      'pf-table__body-cell',
                      `pf-table__cell--${column.align ?? 'left'}`,
                      column.className,
                    )}
                  >
                    {row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';
