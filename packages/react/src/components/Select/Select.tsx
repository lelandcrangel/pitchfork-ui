import { forwardRef, useEffect, useId, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, isActivationKey, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useDisclosure,
  useListNavigation,
  useOutsideInteraction,
} from '../../hooks';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { cx } from '../../utils/cx';
import { Icon } from '../Icon';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'defaultValue' | 'onChange' | 'value'
> {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  name?: string;
  label?: string;
  description?: string;
  error?: string;
  /**
   * Maximum number of options to show before scrolling. If not set, menu grows to fit all options.
   */
  maxVisibleOptions?: number;
  required?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      id,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Select an option',
      name,
      label,
      description,
      error,
      className,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
      maxVisibleOptions,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const descriptionId = description ? `${selectId}-description` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const listboxId = `${selectId}-listbox`;
    const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

    const [selectedValue, setSelectedValue] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const selectedIndex = useMemo(
      () => options.findIndex((option) => option.value === selectedValue),
      [options, selectedValue],
    );
    const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;

    const disclosure = useDisclosure({ disabled });
    const { activeIndex, firstEnabledIndex, lastEnabledIndex, move, setActiveIndex } =
      useListNavigation({
        items: options,
        isDisabled: (option) => Boolean(option.disabled),
        initialIndex:
          selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : undefined,
      });

    const { isOpen } = disclosure;

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const triggerRefs = useComposedRefs(triggerRef, ref);
    const menuStyle = useAnchoredPosition({
      anchorRef: triggerRef,
      enabled: isOpen,
      matchAnchorWidth: true,
    });

    useOutsideInteraction({
      refs: [rootRef, menuRef],
      enabled: isOpen,
      onInteractOutside: disclosure.close,
    });

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const nextIndex =
        selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : firstEnabledIndex;
      setActiveIndex(nextIndex);
    }, [firstEnabledIndex, isOpen, options, selectedIndex, setActiveIndex]);

    const selectValue = (nextValue: string) => {
      setSelectedValue(nextValue);
    };

    const onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (event) => {
      if (disabled) {
        return;
      }

      if (event.key === Keys.ArrowDown || event.key === Keys.ArrowUp) {
        event.preventDefault();

        if (!isOpen) {
          disclosure.open();
          return;
        }

        const startIndex = activeIndex >= 0 ? activeIndex : selectedIndex;
        move(event.key === Keys.ArrowDown ? 'next' : 'previous', startIndex);
        return;
      }

      if (event.key === Keys.Home) {
        event.preventDefault();
        if (firstEnabledIndex >= 0) {
          setActiveIndex(firstEnabledIndex);
        }
        return;
      }

      if (event.key === Keys.End) {
        event.preventDefault();
        if (lastEnabledIndex >= 0) {
          setActiveIndex(lastEnabledIndex);
        }
        return;
      }

      if (isActivationKey(event.key)) {
        event.preventDefault();

        if (!isOpen) {
          disclosure.open();
          return;
        }

        const activeOption = options[activeIndex];
        if (activeOption && !activeOption.disabled) {
          selectValue(activeOption.value);
          disclosure.close();
        }
        return;
      }

      if (event.key === Keys.Escape) {
        disclosure.close();
      }
    };

    return (
      <FieldWrapper
        labelFor={selectId}
        label={label}
        description={description}
        descriptionId={descriptionId}
        error={error}
        errorId={errorId}
        required={required}
      >
        <div className="pf-select" ref={rootRef}>
          <button
            {...props}
            id={selectId}
            ref={triggerRefs}
            type="button"
            className={cx(
              'pf-select__trigger',
              isOpen && 'pf-select__trigger--open',
              error && 'pf-select__trigger--invalid',
              className,
            )}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? listboxId : undefined}
            aria-required={required || undefined}
            aria-describedby={describedBy}
            onClick={() => {
              disclosure.toggle();
            }}
            onKeyDown={onTriggerKeyDown}
          >
            <span className={cx('pf-select__value', !selectedOption && 'pf-select__placeholder')}>
              {selectedOption?.label ?? placeholder}
            </span>
            <span aria-hidden className={cx('pf-select__icon', isOpen && 'pf-select__icon--open')}>
              <Icon name="chevron-down" aria-hidden />
            </span>
          </button>

          {name ? <input type="hidden" name={name} value={selectedOption?.value ?? ''} /> : null}

          {isOpen && typeof document !== 'undefined'
            ? createPortal(
                <ul
                  id={listboxId}
                  ref={menuRef}
                  className="pf-select__menu"
                  style={{
                    ...menuStyle,
                    ...(maxVisibleOptions && options.length > 0
                      ? {
                          maxHeight: `calc(${maxVisibleOptions} * 36px)`,
                          overflowY: 'auto',
                        }
                      : {}),
                  }}
                  role="listbox"
                  aria-labelledby={label ? selectId : undefined}
                >
                  {options.map((option, index) => {
                    const isSelected = option.value === selectedOption?.value;
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={option.value}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled ? true : undefined}
                        className={cx(
                          'pf-select__option',
                          isSelected && 'pf-select__option--selected',
                          isActive && 'pf-select__option--active',
                          option.disabled && 'pf-select__option--disabled',
                        )}
                        onMouseEnter={() => {
                          if (!option.disabled) {
                            setActiveIndex(index);
                          }
                        }}
                        onMouseDown={(event) => {
                          event.preventDefault();
                        }}
                        onClick={() => {
                          if (option.disabled) {
                            return;
                          }
                          selectValue(option.value);
                          disclosure.close();
                          triggerRef.current?.focus();
                        }}
                      >
                        {option.label}
                      </li>
                    );
                  })}
                </ul>,
                document.body,
              )
            : null}
        </div>
      </FieldWrapper>
    );
  },
);

Select.displayName = 'Select';
