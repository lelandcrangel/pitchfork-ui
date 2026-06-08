import { forwardRef, useId } from 'react';
import { Keys } from '../../a11y';
import { useDisclosure } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Collapsible.css';

export interface CollapsibleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onToggle'> {
  /** The clickable header content (text or rich nodes). */
  trigger: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** Show the rotating chevron on the trigger. Defaults to true. */
  showChevron?: boolean;
}

export const Collapsible = forwardRef<HTMLDivElement, CollapsibleProps>(function Collapsible(
  {
    className,
    trigger,
    open,
    defaultOpen,
    onOpenChange,
    disabled = false,
    showChevron = true,
    children,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const triggerId = `${baseId}-trigger`;
  const contentId = `${baseId}-content`;

  const disclosure = useDisclosure({ open, defaultOpen, onOpenChange, disabled });
  const isOpen = disclosure.isOpen ?? false;

  return (
    <div
      ref={ref}
      className={cx('pf-collapsible', isOpen && 'pf-collapsible--open', className)}
      {...props}
    >
      <button
        id={triggerId}
        type="button"
        className="pf-collapsible__trigger"
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => disclosure.toggle()}
        onKeyDown={(event) => {
          if (event.key === Keys.Escape && isOpen) disclosure.close();
        }}
      >
        <span className="pf-collapsible__label">{trigger}</span>
        {showChevron ? (
          <span className="pf-collapsible__icon" aria-hidden>
            <Icon name="chevron-down" aria-hidden />
          </span>
        ) : null}
      </button>

      <div
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cx('pf-collapsible__panel', isOpen && 'pf-collapsible__panel--open')}
        // Remove collapsed content from tab order / a11y tree.
        {...(!isOpen ? ({ inert: true } as Record<string, boolean>) : {})}
      >
        <div className="pf-collapsible__content">
          <div className="pf-collapsible__content-inner">{children}</div>
        </div>
      </div>
    </div>
  );
});

Collapsible.displayName = 'Collapsible';
