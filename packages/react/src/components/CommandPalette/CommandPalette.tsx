import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Keys } from '../../a11y';
import { useListNavigation, usePresence } from '../../hooks';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './CommandPalette.css';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  /** Grouping label — items with the same group name are visually grouped. */
  group?: string;
  disabled?: boolean;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CommandPalette({
  open,
  onOpenChange,
  items,
  placeholder = 'Search commands…',
  emptyMessage = 'No results found.',
}: CommandPaletteProps) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isMounted, isExiting } = usePresence(open, 180);

  // Reset query and focus the input each time the palette opens.
  useEffect(() => {
    if (!open) return;
    // Defer both so the portal has painted before we manipulate state/focus.
    const frame = requestAnimationFrame(() => {
      setQuery('');
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!isMounted || typeof document === 'undefined') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMounted]);

  useFocusTrap({
    containerRef: dialogRef,
    enabled: open,
    onEscape: () => onOpenChange(false),
  });

  // Filter items by query.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.group?.toLowerCase().includes(q),
    );
  }, [items, query]);

  const { activeIndex, move, setActiveIndex } = useListNavigation({
    items: filtered,
    isDisabled: (item) => !!item.disabled,
  });

  // Reset active index when the filtered list changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [query, setActiveIndex]);

  const selectActive = () => {
    const item = filtered[activeIndex];
    if (item && !item.disabled) {
      item.onSelect();
      onOpenChange(false);
    }
  };

  const onKeyDown: React.KeyboardEventHandler = (e) => {
    if (e.key === Keys.ArrowDown) {
      e.preventDefault();
      move('next');
    } else if (e.key === Keys.ArrowUp) {
      e.preventDefault();
      move('previous');
    } else if (e.key === Keys.Home) {
      e.preventDefault();
      move('first');
    } else if (e.key === Keys.End) {
      e.preventDefault();
      move('last');
    } else if (e.key === Keys.Enter) {
      e.preventDefault();
      selectActive();
    }
  };

  // Build grouped display list.
  const groupedItems = useMemo(() => {
    const groups: { group: string | undefined; items: { item: CommandItem; index: number }[] }[] =
      [];
    const seen = new Map<string | undefined, number>();
    filtered.forEach((item, index) => {
      const g = item.group;
      if (!seen.has(g)) {
        seen.set(g, groups.length);
        groups.push({ group: g, items: [] });
      }
      groups[seen.get(g)!].items.push({ item, index });
    });
    return groups;
  }, [filtered]);

  const activeOptionId = filtered[activeIndex] ? `${listId}-option-${activeIndex}` : undefined;

  if (!isMounted || typeof document === 'undefined') return null;

  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop dismiss is a pointer affordance; Escape is the keyboard path
    <div
      className={cx('pf-command__backdrop', isExiting && 'pf-command__backdrop--exiting')}
      onClick={() => onOpenChange(false)}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- dialog keyboard handling (Escape, arrows) lives on the container */}
      <div
        ref={dialogRef}
        className={cx('pf-command', isExiting && 'pf-command--exiting')}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        {/* Search input */}
        <div className="pf-command__search">
          <Icon name="magnifying-glass" aria-hidden className="pf-command__search-icon" />
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            className="pf-command__input"
            value={query}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-controls={listId}
            aria-activedescendant={activeOptionId}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="pf-command__esc-hint" aria-hidden>
            esc
          </kbd>
        </div>

        {/* Results list */}
        <div id={listId} role="listbox" aria-label="Commands" className="pf-command__list">
          {filtered.length === 0 ? (
            <p className="pf-command__empty" role="presentation">
              {emptyMessage}
            </p>
          ) : (
            groupedItems.map(({ group, items: groupItems }) => (
              <div key={group ?? '__ungrouped'} role="presentation">
                {group ? (
                  <p className="pf-command__group-label" role="presentation">
                    {group}
                  </p>
                ) : null}
                {groupItems.map(({ item, index }) => {
                  const isActive = index === activeIndex;
                  return (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- aria-activedescendant pattern: keyboard stays on the input, options are mouse targets
                    <div
                      key={item.id}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isActive}
                      aria-disabled={item.disabled ? true : undefined}
                      className={cx(
                        'pf-command__item',
                        isActive && 'pf-command__item--active',
                        item.disabled && 'pf-command__item--disabled',
                      )}
                      onMouseEnter={() => {
                        if (!item.disabled) setActiveIndex(index);
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!item.disabled) {
                          item.onSelect();
                          onOpenChange(false);
                        }
                      }}
                    >
                      {item.icon ? (
                        <span className="pf-command__item-icon" aria-hidden>
                          {item.icon}
                        </span>
                      ) : null}
                      <span className="pf-command__item-content">
                        <span className="pf-command__item-label">{item.label}</span>
                        {item.description ? (
                          <span className="pf-command__item-description">{item.description}</span>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
