import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './SlideoutMenu.css';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type SlideoutMenuPlacement = 'left' | 'right';
export type SlideoutMenuSize = 'sm' | 'md' | 'lg';

export interface SlideoutMenuProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  placement?: SlideoutMenuPlacement;
  size?: SlideoutMenuSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export function SlideoutMenu({
  className,
  open,
  onOpenChange,
  title,
  description,
  footer,
  placement = 'right',
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
  ...props
}: SlideoutMenuProps) {
  const ANIMATION_DURATION_MS = 220;
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (open) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }

      setMounted(true);
      setVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setVisible(true);
        closeTimerRef.current = null;
      }, 16);
      return;
    }

    setVisible(false);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
    }, ANIMATION_DURATION_MS);

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!mounted || !open || typeof document === 'undefined') {
      return;
    }

    const getFocusableElements = () => {
      if (!panelRef.current) {
        return [] as HTMLElement[];
      }

      return Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
    };

    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();

      if (focusableElements.length > 0) {
        focusableElements[0]?.focus();
        return;
      }

      panelRef.current?.focus();
    };

    const focusLastElement = () => {
      const focusableElements = getFocusableElements();

      if (focusableElements.length > 0) {
        focusableElements[focusableElements.length - 1]?.focus();
        return;
      }

      panelRef.current?.focus();
    };

    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusFirstElement();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) {
        return;
      }

      const focusableElements = getFocusableElements();
      const activeElement = document.activeElement as HTMLElement | null;

      if (!panelRef.current.contains(activeElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          focusLastElement();
          return;
        }
        focusFirstElement();
        return;
      }

      if (focusableElements.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (
          activeElement === firstElement ||
          activeElement === panelRef.current
        ) {
          event.preventDefault();
          focusLastElement();
        }
        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        focusFirstElement();
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!panelRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && panelRef.current.contains(target)) {
        return;
      }

      focusFirstElement();
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocusIn);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocusIn);
      previousActiveRef.current?.focus?.();
    };
  }, [mounted, open, onOpenChange]);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="pf-slideout__portal"
      data-state={visible ? 'open' : 'closed'}
    >
      <div
        className="pf-slideout__overlay"
        onClick={() => {
          if (closeOnOverlayClick) {
            onOpenChange?.(false);
          }
        }}
      />

      <div
        className={cx(
          'pf-slideout__viewport',
          `pf-slideout__viewport--${placement}`,
        )}
      >
        <div
          ref={panelRef}
          className={cx('pf-slideout', `pf-slideout--${size}`, className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          {...props}
        >
          {title || description || showCloseButton ? (
            <header className="pf-slideout__header">
              <div className="pf-slideout__heading-group">
                {title ? (
                  <h2 className="pf-slideout__title" id={titleId}>
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="pf-slideout__description" id={descriptionId}>
                    {description}
                  </p>
                ) : null}
              </div>

              {showCloseButton ? (
                <button
                  type="button"
                  className="pf-slideout__close"
                  aria-label="Close slideout"
                  onClick={() => onOpenChange?.(false)}
                >
                  <Icon name="circle-xmark" aria-hidden />
                </button>
              ) : null}
            </header>
          ) : null}

          <div className="pf-slideout__body">{children}</div>

          {footer ? (
            <footer className="pf-slideout__footer">{footer}</footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

SlideoutMenu.displayName = 'SlideoutMenu';
