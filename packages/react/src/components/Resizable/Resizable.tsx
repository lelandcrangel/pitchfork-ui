import { Children, forwardRef, useId, useRef } from 'react';
import { Keys } from '../../a11y';
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

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

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
  const value = clamp(current ?? defaultSize, min, max);

  const isHorizontal = orientation === 'horizontal';
  const panels = Children.toArray(children);
  const first = panels[0] ?? null;
  const second = panels[1] ?? null;

  const setFromPointer = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = isHorizontal
      ? ((clientX - rect.left) / rect.width) * 100
      : ((clientY - rect.top) / rect.height) * 100;
    setCurrent(clamp(Math.round(pct), min, max));
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
    const decKey = isHorizontal ? Keys.ArrowLeft : Keys.ArrowUp;
    const incKey = isHorizontal ? Keys.ArrowRight : Keys.ArrowDown;
    if (event.key === decKey) {
      event.preventDefault();
      setCurrent(clamp(value - step, min, max));
    } else if (event.key === incKey) {
      event.preventDefault();
      setCurrent(clamp(value + step, min, max));
    } else if (event.key === Keys.Home) {
      event.preventDefault();
      setCurrent(min);
    } else if (event.key === Keys.End) {
      event.preventDefault();
      setCurrent(max);
    }
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
