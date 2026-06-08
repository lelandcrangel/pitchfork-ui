import { cloneElement, useEffect, useId, useRef, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useOutsideInteraction,
  usePresence,
} from '../../hooks';
import { cx } from '../../utils/cx';
import './Popover.css';

export interface PopoverProps {
  /** The element the popover anchors to and toggles from (e.g. a Button). */
  trigger: ReactElement;
  children: React.ReactNode;
  /** Controlled open state. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Horizontal alignment relative to the trigger. Default `start`. */
  align?: 'start' | 'end';
  /** Accessible label for the popover dialog. */
  label?: string;
  /** Close when clicking/tapping outside. Default true. */
  closeOnOutsideClick?: boolean;
  className?: string;
}

type TriggerProps = {
  ref?: React.Ref<HTMLElement>;
  onClick?: (event: React.MouseEvent) => void;
};

export function Popover({
  trigger,
  children,
  open,
  defaultOpen,
  onOpenChange,
  align = 'start',
  label,
  closeOnOutsideClick = true,
  className,
}: PopoverProps) {
  const [isOpen = false, setOpen] = useControllableState<boolean>({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  const contentId = useId();
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { isMounted, isExiting } = usePresence(isOpen, 160);

  const style = useAnchoredPosition({
    anchorRef: triggerRef,
    floatingRef: contentRef,
    enabled: isOpen,
    align,
    matchAnchorWidth: false,
    flip: true,
  });

  useOutsideInteraction({
    refs: [triggerRef, contentRef],
    enabled: isOpen,
    onInteractOutside: () => {
      if (closeOnOutsideClick) {
        setOpen(false);
      }
    },
  });

  // Move focus into the panel on open; return it to the trigger on close.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (isOpen) {
      wasOpen.current = true;
      contentRef.current?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  const triggerProps = trigger.props as TriggerProps;
  const existingRef = ((trigger as { ref?: React.Ref<HTMLElement> }).ref ?? triggerProps.ref) as
    | React.Ref<HTMLElement>
    | undefined;
  const composedTriggerRef = useComposedRefs(triggerRef, existingRef);

  const triggerNode = cloneElement(trigger, {
    ref: composedTriggerRef,
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
    onClick: (event: React.MouseEvent) => {
      triggerProps.onClick?.(event);
      setOpen(!isOpen);
    },
  } as Partial<TriggerProps> & Record<string, unknown>);

  return (
    <>
      {triggerNode}

      {isMounted && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={contentRef}
              id={contentId}
              role="dialog"
              aria-label={label}
              tabIndex={-1}
              className={cx('pf-popover', isExiting && 'pf-popover--exiting', className)}
              style={style}
              onKeyDown={(event) => {
                if (event.key === Keys.Escape) {
                  event.stopPropagation();
                  setOpen(false);
                }
              }}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

Popover.displayName = 'Popover';
