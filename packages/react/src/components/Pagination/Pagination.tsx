import * as React from 'react';
import { cx } from '../../utils/cx';
import './Pagination.css';

type PaginationItem = number | 'ellipsis-left' | 'ellipsis-right';

function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 0) {
    return 1;
  }

  return Math.min(Math.max(page, 1), totalPages);
}

function getPaginationItems(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number,
): PaginationItem[] {
  const safeTotal = Math.max(totalPages, 1);
  const safeCurrent = clampPage(currentPage, safeTotal);
  const safeSiblingCount = Math.max(siblingCount, 0);
  const safeBoundaryCount = Math.max(boundaryCount, 0);

  const leftBoundaryEnd = Math.min(safeBoundaryCount, safeTotal);
  const rightBoundaryStart = Math.max(safeTotal - safeBoundaryCount + 1, 1);

  const start = Math.max(safeCurrent - safeSiblingCount, leftBoundaryEnd + 1);
  const end = Math.min(safeCurrent + safeSiblingCount, rightBoundaryStart - 1);

  const items: PaginationItem[] = [];

  for (let page = 1; page <= leftBoundaryEnd; page += 1) {
    items.push(page);
  }

  if (start > leftBoundaryEnd + 1) {
    items.push('ellipsis-left');
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < rightBoundaryStart - 1) {
    items.push('ellipsis-right');
  }

  for (let page = rightBoundaryStart; page <= safeTotal; page += 1) {
    if (page > leftBoundaryEnd) {
      items.push(page);
    }
  }

  if (!items.length) {
    return [1];
  }

  return items;
}

export interface PaginationProps extends React.HTMLAttributes<HTMLElement> {
  page?: number;
  defaultPage?: number;
  totalPages: number;
  siblingCount?: number;
  boundaryCount?: number;
  showPrevNext?: boolean;
  disabled?: boolean;
  onPageChange?: (page: number) => void;
  prevLabel?: React.ReactNode;
  nextLabel?: React.ReactNode;
}

export function Pagination({
  className,
  page,
  defaultPage = 1,
  totalPages,
  siblingCount = 1,
  boundaryCount = 1,
  showPrevNext = true,
  disabled = false,
  onPageChange,
  prevLabel = 'Previous',
  nextLabel = 'Next',
  'aria-label': ariaLabel = 'Pagination',
  ...props
}: PaginationProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const [internalPage, setInternalPage] = React.useState(() =>
    clampPage(defaultPage, safeTotalPages),
  );

  const currentPage = clampPage(page ?? internalPage, safeTotalPages);
  const items = getPaginationItems(
    currentPage,
    safeTotalPages,
    siblingCount,
    boundaryCount,
  );

  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < safeTotalPages;

  const setPage = React.useCallback(
    (nextPage: number) => {
      const clamped = clampPage(nextPage, safeTotalPages);

      if (page === undefined) {
        setInternalPage(clamped);
      }

      onPageChange?.(clamped);
    },
    [onPageChange, page, safeTotalPages],
  );

  return (
    <nav
      className={cx(
        'pf-pagination',
        disabled && 'pf-pagination--disabled',
        className,
      )}
      aria-label={ariaLabel}
      {...props}
    >
      {showPrevNext ? (
        <button
          type="button"
          className="pf-pagination__nav"
          onClick={() => setPage(currentPage - 1)}
          disabled={disabled || !canGoPrev}
        >
          {prevLabel}
        </button>
      ) : null}

      <ol className="pf-pagination__list">
        {items.map((item, index) => {
          if (typeof item !== 'number') {
            return (
              <li
                key={`${item}-${index}`}
                className="pf-pagination__ellipsis"
                aria-hidden
              >
                ...
              </li>
            );
          }

          const isCurrent = item === currentPage;

          return (
            <li key={item}>
              <button
                type="button"
                className={cx(
                  'pf-pagination__page',
                  isCurrent && 'pf-pagination__page--active',
                )}
                onClick={() => setPage(item)}
                disabled={disabled}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item}
              </button>
            </li>
          );
        })}
      </ol>

      {showPrevNext ? (
        <button
          type="button"
          className="pf-pagination__nav"
          onClick={() => setPage(currentPage + 1)}
          disabled={disabled || !canGoNext}
        >
          {nextLabel}
        </button>
      ) : null}
    </nav>
  );
}

Pagination.displayName = 'Pagination';
