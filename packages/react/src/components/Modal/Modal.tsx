import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap, usePresence } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Modal.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

export type ModalSectionProps = React.HTMLAttributes<HTMLDivElement>;

export const ModalHeader = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-modal__header', className)} {...props} />
  ),
);
ModalHeader.displayName = 'ModalHeader';

export const ModalBody = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-modal__body', className)} {...props} />
  ),
);
ModalBody.displayName = 'ModalBody';

export const ModalFooter = forwardRef<HTMLDivElement, ModalSectionProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx('pf-modal__footer', className)} {...props} />
  ),
);
ModalFooter.displayName = 'ModalFooter';

export const Modal = forwardRef<HTMLDivElement, ModalProps>(function Modal(
  {
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
  },
  ref,
) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const { isMounted, isExiting } = usePresence(open);

  useImperativeHandle(ref, () => dialogRef.current as HTMLDivElement, []);

  useEffect(() => {
    if (!isMounted || typeof document === 'undefined') {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMounted]);

  useFocusTrap({
    containerRef: dialogRef,
    enabled: open,
    onEscape: () => onOpenChange?.(false),
  });

  if (!isMounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pf-modal__portal">
      <div
        className={cx('pf-modal__overlay', isExiting && 'pf-modal__overlay--exiting')}
        onClick={() => {
          if (closeOnOverlayClick) {
            onOpenChange?.(false);
          }
        }}
      />
      <div className="pf-modal__viewport">
        <div
          ref={dialogRef}
          className={cx(
            'pf-modal',
            `pf-modal--${size}`,
            isExiting && 'pf-modal--exiting',
            className,
          )}
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
});

Modal.displayName = 'Modal';
