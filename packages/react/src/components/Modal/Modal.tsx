import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'title'
> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export interface ModalSectionProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className, ...props }: ModalSectionProps) {
  return <div className={cx('pf-modal__header', className)} {...props} />;
}

export function ModalBody({ className, ...props }: ModalSectionProps) {
  return <div className={cx('pf-modal__body', className)} {...props} />;
}

export function ModalFooter({ className, ...props }: ModalSectionProps) {
  return <div className={cx('pf-modal__footer', className)} {...props} />;
}

const getFocusableElements = (container: HTMLElement) => {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (element) => {
      if (element.hasAttribute('disabled')) {
        return false;
      }

      return element.offsetParent !== null;
    },
  );
};

export function Modal({
  className,
  open,
  onOpenChange,
  title,
  description,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  children,
  ...props
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return;
    }

    previousActiveRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const initialFocusable = dialogRef.current
      ? getFocusableElements(dialogRef.current)[0]
      : undefined;
    initialFocusable?.focus() ?? dialogRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange?.(false);
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(dialogRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;
      const isInsideDialog = activeElement
        ? dialogRef.current.contains(activeElement)
        : false;

      if (!isInsideDialog) {
        event.preventDefault();
        (event.shiftKey ? lastElement : firstElement).focus();
        return;
      }

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousActiveRef.current?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pf-modal__portal">
      <div
        className="pf-modal__overlay"
        onClick={() => {
          if (closeOnOverlayClick) {
            onOpenChange?.(false);
          }
        }}
      />
      <div className="pf-modal__viewport">
        <div
          ref={dialogRef}
          className={cx('pf-modal', `pf-modal--${size}`, className)}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          {...props}
        >
          {title || description || showCloseButton ? (
            <ModalHeader>
              <div className="pf-modal__heading-group">
                {title ? (
                  <h2 className="pf-modal__title" id={titleId}>
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="pf-modal__description" id={descriptionId}>
                    {description}
                  </p>
                ) : null}
              </div>
              {showCloseButton ? (
                <button
                  type="button"
                  className="pf-modal__close"
                  aria-label="Close modal"
                  onClick={() => onOpenChange?.(false)}
                >
                  <Icon name="circle-xmark" aria-hidden />
                </button>
              ) : null}
            </ModalHeader>
          ) : null}

          <ModalBody>{children}</ModalBody>

          {footer ? <ModalFooter>{footer}</ModalFooter> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
