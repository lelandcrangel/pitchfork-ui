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
import './MultiSelect.css';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'defaultValue' | 'onChange' | 'value'
> {
  options: MultiSelectOption[];
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  placeholder?: string;
  name?: string;
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
}

export const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      id,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = 'Select options',
      name,
      label,
      description,
      error,
      className,
      disabled,
      required,
      'aria-describedby': ariaDescribedBy,
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

    const [controllableSelectedValues, setSelectedValues] = useControllableState({
      value,
      defaultValue: defaultValue ?? [],
      onChange: onValueChange,
    });
    const selectedValues = useMemo(
      () => controllableSelectedValues ?? [],
      [controllableSelectedValues],
    );

    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
    const selectedOptions = useMemo(
      () => options.filter((option) => selectedSet.has(option.value)),
      [options, selectedSet],
    );

    const selectedIndex = options.findIndex(
      (option) => selectedSet.has(option.value) && !option.disabled,
    );
    const disclosure = useDisclosure({ disabled });
    const { isOpen } = disclosure;
    const { activeIndex, firstEnabledIndex, lastEnabledIndex, move, setActiveIndex } =
      useListNavigation({
        items: options,
        isDisabled: (option) => Boolean(option.disabled),
        initialIndex: selectedIndex >= 0 ? selectedIndex : undefined,
      });
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

      const nextIndex = selectedIndex >= 0 ? selectedIndex : firstEnabledIndex;
      setActiveIndex(nextIndex);
    }, [firstEnabledIndex, isOpen, selectedIndex, setActiveIndex]);

    const updateValue = (nextValue: string[]) => {
      setSelectedValues(nextValue);
    };

    const toggleValue = (nextValue: string) => {
      if (selectedSet.has(nextValue)) {
        updateValue(selectedValues.filter((valueItem) => valueItem !== nextValue));
        return;
      }

      updateValue([...selectedValues, nextValue]);
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

        const startIndex = activeIndex >= 0 ? activeIndex : 0;
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
          toggleValue(activeOption.value);
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
        <div className="pf-multi-select" ref={rootRef}>
          <button
            {...props}
            id={selectId}
            ref={triggerRefs}
            type="button"
            className={cx(
              'pf-multi-select__trigger',
              isOpen && 'pf-multi-select__trigger--open',
              error && 'pf-multi-select__trigger--invalid',
              className,
            )}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-required={required || undefined}
            aria-controls={isOpen ? listboxId : undefined}
            aria-describedby={describedBy}
            onClick={() => {
              disclosure.toggle();
            }}
            onKeyDown={onTriggerKeyDown}
          >
            {selectedOptions.length > 0 ? (
              <span className="pf-multi-select__chips">
                {selectedOptions.map((option) => (
                  <span key={option.value} className="pf-multi-select__chip">
                    {option.label}
                  </span>
                ))}
              </span>
            ) : (
              <span className="pf-multi-select__placeholder">{placeholder}</span>
            )}

            <span
              aria-hidden
              className={cx('pf-multi-select__icon', isOpen && 'pf-multi-select__icon--open')}
            >
              <Icon name="chevron-down" aria-hidden />
            </span>
          </button>

          {name
            ? selectedValues.map((selectedValue) => (
                <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
              ))
            : null}

          {isOpen && typeof document !== 'undefined'
            ? createPortal(
                <ul
                  id={listboxId}
                  ref={menuRef}
                  className="pf-multi-select__menu"
                  style={menuStyle}
                  role="listbox"
                  aria-multiselectable="true"
                  aria-labelledby={label ? selectId : undefined}
                >
                  {options.map((option, index) => {
                    const isSelected = selectedSet.has(option.value);
                    const isActive = index === activeIndex;

                    return (
                      <li
                        key={option.value}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled ? true : undefined}
                        className={cx(
                          'pf-multi-select__option',
                          isSelected && 'pf-multi-select__option--selected',
                          isActive && 'pf-multi-select__option--active',
                          option.disabled && 'pf-multi-select__option--disabled',
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
                          toggleValue(option.value);
                          triggerRef.current?.focus();
                        }}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span className="pf-multi-select__check" aria-hidden>
                            <Icon name="square-check" aria-hidden />
                          </span>
                        ) : null}
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

MultiSelect.displayName = 'MultiSelect';
