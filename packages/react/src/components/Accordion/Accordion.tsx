import { forwardRef, useId, useRef } from 'react';
import { Keys } from '../../a11y';
import { useControllableState } from '../../hooks';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Accordion.css';

export type AccordionType = 'single' | 'multiple';

export interface AccordionItemData {
  value: string;
  title: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'defaultValue'
> {
  items: AccordionItemData[];
  /** `single` collapses other panels when one opens; `multiple` allows many. Default `single`. */
  type?: AccordionType;
  /** Controlled list of expanded item values. */
  value?: string[];
  /** Initial expanded item values (uncontrolled). */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Heading level for each item's header. Default 3. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    className,
    items,
    type = 'single',
    value,
    defaultValue,
    onValueChange,
    headingLevel = 3,
    ...props
  },
  ref,
) {
  const baseId = useId();
  const [expanded = [], setExpanded] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  });
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const toggle = (itemValue: string) => {
    const isOpen = expanded.includes(itemValue);
    if (type === 'single') {
      setExpanded(isOpen ? [] : [itemValue]);
    } else {
      setExpanded(isOpen ? expanded.filter((v) => v !== itemValue) : [...expanded, itemValue]);
    }
  };

  const enabledIndexes = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => !item.disabled)
    .map(({ index }) => index);

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (enabledIndexes.length === 0) {
      return;
    }
    const position = enabledIndexes.indexOf(index);
    let target: number | undefined;

    if (event.key === Keys.ArrowDown) {
      target = enabledIndexes[(position + 1) % enabledIndexes.length];
    } else if (event.key === Keys.ArrowUp) {
      target = enabledIndexes[(position - 1 + enabledIndexes.length) % enabledIndexes.length];
    } else if (event.key === Keys.Home) {
      target = enabledIndexes[0];
    } else if (event.key === Keys.End) {
      target = enabledIndexes[enabledIndexes.length - 1];
    }

    if (target !== undefined) {
      event.preventDefault();
      triggerRefs.current[target]?.focus();
    }
  };

  const Heading = `h${headingLevel}` as keyof React.JSX.IntrinsicElements;

  return (
    <div ref={ref} className={cx('pf-accordion', className)} {...props}>
      {items.map((item, index) => {
        const isOpen = expanded.includes(item.value);
        const triggerId = `${baseId}-trigger-${item.value}`;
        const panelId = `${baseId}-panel-${item.value}`;

        return (
          <div
            key={item.value}
            className={cx('pf-accordion__item', isOpen && 'pf-accordion__item--open')}
          >
            <Heading className="pf-accordion__heading">
              <button
                ref={(element) => {
                  triggerRefs.current[index] = element;
                }}
                type="button"
                id={triggerId}
                className="pf-accordion__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                onClick={() => toggle(item.value)}
                onKeyDown={(event) => onTriggerKeyDown(event, index)}
              >
                <span className="pf-accordion__title">{item.title}</span>
                <span className="pf-accordion__icon" aria-hidden>
                  <Icon name="chevron-down" aria-hidden />
                </span>
              </button>
            </Heading>

            <div className={cx('pf-accordion__panel', isOpen && 'pf-accordion__panel--open')}>
              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                className="pf-accordion__content"
                {...(isOpen ? {} : ({ inert: true } as Record<string, boolean>))}
              >
                <div className="pf-accordion__content-inner">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

Accordion.displayName = 'Accordion';
