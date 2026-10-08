import { clampSplitSize, resolveSplitterKey, splitSizeFromPointer } from '@pitchfork-ui/core';
import { Children, forwardRef, useId, useRef } from 'react';
import { useComposedRefs, useControllableState } from '../../hooks';
import { cx } from '../../utils/cx';
import './Resizable.css';

export type ResizableOrientation = 'horizontal' | 'vertical';

export interface ResizableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** `horizontal` = side-by-side panels (drag left/right). `vertical` = stacked (drag up/down). */
  orientation?: ResizableOrientation;
  /** Size of the first panel as a percentage (0–100). */
  size?: number;
  defaultSize?: number;
  onSizeChange?: (size: number) => void;
  /** Min/max size of the first panel, in percent. */
  min?: number;
  max?: number;
  /** Keyboard resize increment, in percent. Defaults to 2. */
  step?: number;
  /** Accessible name for the resize handle. */
  handleLabel?: string;
  /** Exactly two children: the first and second panels. */
  children: React.ReactNode;
}

export const Resizable = forwardRef<HTMLDivElement, ResizableProps>(function Resizable(
  {
    className,
    orientation = 'horizontal',
    size,
    defaultSize = 50,
    onSizeChange,
    min = 10,
    max = 90,
    step = 2,
    handleLabel = 'Resize panels',
    children,
    ...props
  },
  ref,
) {
  const handleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerRefs = useComposedRefs(containerRef, ref);
  const draggingRef = useRef(false);

  const [current, setCurrent] = useControllableState<number>({
    value: size,
    defaultValue: defaultSize,
    onChange: onSizeChange,
  });
  /*
   * Core's, so `<pf-resizable>` clamps the same way — including that a size
   * which is not a finite number becomes an even split of the bounds rather
   * than reaching the DOM as `flex-basis: NaN%`, an invalid declaration that
   * collapses the panel.
   */
  const value = clampSplitSize(current ?? defaultSize, { min, max });

  const isHorizontal = orientation === 'horizontal';
  const panels = Children.toArray(children);
  const first = panels[0] ?? null;
  const second = panels[1] ?? null;

  const setFromPointer = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // `null` when the container has no length — a splitter dragged before its
    // first layout — in which case the size it already had stands.
    const next = isHorizontal
      ? splitSizeFromPointer(clientX, rect.left, rect.width, { min, max })
      : splitSizeFromPointer(clientY, rect.top, rect.height, { min, max });
    if (next !== null) setCurrent(next);
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggingRef.current = true;
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!draggingRef.current) return;
    setFromPointer(event.clientX, event.clientY);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (event) => {
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    /*
     * Core decides, including which arrows this orientation answers to: a
     * horizontal splitter leaves Up and Down to the page, so Enter and the
     * arrows it does not handle report `null` and nothing is prevented.
     */
    const next = resolveSplitterKey(event.key, { orientation, size: value, min, max, step });
    if (next === null) return;
    event.preventDefault();
    setCurrent(next);
  };

  return (
    <div
      ref={containerRefs}
      className={cx('pf-resizable', `pf-resizable--${orientation}`, className)}
      {...props}
    >
      <div className="pf-resizable__panel" style={{ flexBasis: `${value}%` }}>
        {first}
      </div>

      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- APG window-splitter: a focusable separator is an interactive widget */}
      <div
        id={handleId}
        role="separator"
        tabIndex={0}
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-label={handleLabel}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className="pf-resizable__handle"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="pf-resizable__grip" aria-hidden />
      </div>

      <div className="pf-resizable__panel pf-resizable__panel--fill">{second}</div>
    </div>
  );
});

Resizable.displayName = 'Resizable';
