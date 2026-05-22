import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
}

const findNextEnabledIndex = (
  options: MultiSelectOption[],
  startIndex: number,
  direction: 1 | -1,
) => {
  if (options.length === 0) {
    return -1;
  }

  let index = startIndex;
  for (let step = 0; step < options.length; step += 1) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.disabled) {
      return index;
    }
  }

  return -1;
};

const findFirstEnabledIndex = (options: MultiSelectOption[]) => {
  return options.findIndex((option) => !option.disabled);
};

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
    const describedBy =
      [ariaDescribedBy, descriptionId, errorId].filter(Boolean).join(' ') ||
      undefined;

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
    const selectedValues = isControlled ? value ?? [] : internalValue;

    const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
    const selectedOptions = useMemo(
      () => options.filter((option) => selectedSet.has(option.value)),
      [options, selectedSet],
    );

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(() => {
      const selectedIndex = options.findIndex(
        (option) => selectedSet.has(option.value) && !option.disabled,
      );
      if (selectedIndex >= 0) {
        return selectedIndex;
      }
      return findFirstEnabledIndex(options);
    });

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLUListElement>(null);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const selectedIndex = options.findIndex(
        (option) => selectedSet.has(option.value) && !option.disabled,
      );
      const nextIndex =
        selectedIndex >= 0 ? selectedIndex : findFirstEnabledIndex(options);
      setActiveIndex(nextIndex);
    }, [isOpen, options, selectedSet]);

    useEffect(() => {
      const handlePointerDown = (event: PointerEvent) => {
        const target = event.target as Node;
        if (
          !rootRef.current?.contains(target) &&
          !menuRef.current?.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener('pointerdown', handlePointerDown);
      return () => {
        document.removeEventListener('pointerdown', handlePointerDown);
      };
    }, []);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      const updateMenuPosition = () => {
        const trigger = triggerRef.current;
        if (!trigger) {
          return;
        }

        const rect = trigger.getBoundingClientRect();
        setMenuStyle({
          left: rect.left,
          top: rect.bottom + 8,
          width: rect.width,
        });
      };

      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition, true);

      return () => {
        window.removeEventListener('resize', updateMenuPosition);
        window.removeEventListener('scroll', updateMenuPosition, true);
      };
    }, [isOpen]);

    const updateValue = (nextValue: string[]) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    };

    const toggleValue = (nextValue: string) => {
      if (selectedSet.has(nextValue)) {
        updateValue(selectedValues.filter((valueItem) => valueItem !== nextValue));
        return;
      }

      updateValue([...selectedValues, nextValue]);
    };

    const openMenu = () => {
      if (disabled) {
        return;
      }
      setIsOpen(true);
    };

    const onTriggerKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (
      event,
    ) => {
      if (disabled) {
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();

        if (!isOpen) {
          openMenu();
          return;
        }

        const direction = event.key === 'ArrowDown' ? 1 : -1;
        const startIndex = activeIndex >= 0 ? activeIndex : 0;
        const nextIndex = findNextEnabledIndex(options, startIndex, direction);
        if (nextIndex >= 0) {
          setActiveIndex(nextIndex);
        }
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        const firstEnabled = findFirstEnabledIndex(options);
        if (firstEnabled >= 0) {
          setActiveIndex(firstEnabled);
        }
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        const lastEnabled = [...options]
          .reverse()
          .findIndex((option) => !option.disabled);
        if (lastEnabled >= 0) {
          setActiveIndex(options.length - 1 - lastEnabled);
        }
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();

        if (!isOpen) {
          openMenu();
          return;
        }

        const activeOption = options[activeIndex];
        if (activeOption && !activeOption.disabled) {
          toggleValue(activeOption.value);
        }
        return;
      }

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    return (
      <div className="pf-field">
        {label ? (
          <label className="pf-field__label" htmlFor={selectId}>
            {label}
          </label>
        ) : null}

        <div className="pf-multi-select" ref={rootRef}>
          <button
            {...props}
            id={selectId}
            ref={(node) => {
              triggerRef.current = node;
              if (typeof ref === 'function') {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
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
            aria-controls={isOpen ? listboxId : undefined}
            aria-describedby={describedBy}
            onClick={() => {
              if (disabled) {
                return;
              }
              setIsOpen((current) => !current);
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
              className={cx(
                'pf-multi-select__icon',
                isOpen && 'pf-multi-select__icon--open',
              )}
            >
              <Icon name="square-caret-down" aria-hidden />
            </span>
          </button>

          {name
            ? selectedValues.map((selectedValue) => (
                <input
                  key={selectedValue}
                  type="hidden"
                  name={name}
                  value={selectedValue}
                />
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

        {description ? (
          <p className="pf-field__description" id={descriptionId}>
            {description}
          </p>
        ) : null}
        {error ? (
          <p className="pf-field__error" id={errorId}>
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

MultiSelect.displayName = 'MultiSelect';
