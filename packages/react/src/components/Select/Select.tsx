import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
}

const findNextEnabledIndex = (
  options: SelectOption[],
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

const findFirstEnabledIndex = (options: SelectOption[]) => {
  return options.findIndex((option) => !option.disabled);
};

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
    const [internalValue, setInternalValue] = useState(defaultValue);
    const selectedValue = isControlled ? value : internalValue;
    const selectedIndex = useMemo(
      () => options.findIndex((option) => option.value === selectedValue),
      [options, selectedValue],
    );
    const selectedOption =
      selectedIndex >= 0 ? options[selectedIndex] : undefined;

    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number>(() => {
      if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
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

      const nextIndex =
        selectedIndex >= 0 && !options[selectedIndex]?.disabled
          ? selectedIndex
          : findFirstEnabledIndex(options);
      setActiveIndex(nextIndex);
    }, [isOpen, options, selectedIndex]);

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

    const selectValue = (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    };

    const openMenu = () => {
      if (disabled) {
        return;
      }
      setIsOpen(true);
    };

    const closeMenu = () => {
      setIsOpen(false);
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
        const startIndex = activeIndex >= 0 ? activeIndex : selectedIndex;
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
          selectValue(activeOption.value);
          closeMenu();
        }
        return;
      }

      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    return (
      <div className="pf-field">
        {label ? (
          <label className="pf-field__label" htmlFor={selectId}>
            {label}
          </label>
        ) : null}
        <div className="pf-select" ref={rootRef}>
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
              'pf-select__trigger',
              isOpen && 'pf-select__trigger--open',
              error && 'pf-select__trigger--invalid',
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
            <span
              className={cx(
                'pf-select__value',
                !selectedOption && 'pf-select__placeholder',
              )}
            >
              {selectedOption?.label ?? placeholder}
            </span>
            <span
              aria-hidden
              className={cx(
                'pf-select__icon',
                isOpen && 'pf-select__icon--open',
              )}
            >
              <Icon name="square-caret-down" aria-hidden />
            </span>
          </button>

          {name ? (
            <input
              type="hidden"
              name={name}
              value={selectedOption?.value ?? ''}
            />
          ) : null}

          {isOpen && typeof document !== 'undefined'
            ? createPortal(
                <ul
                  id={listboxId}
                  ref={menuRef}
                  className="pf-select__menu"
                  style={menuStyle}
                  role="listbox"
                  aria-labelledby={label ? selectId : undefined}
                >
                  {options.map((option, index) => {
                    const isSelected = option.value === selectedOption?.value;
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={option.value}
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
                          closeMenu();
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

Select.displayName = 'Select';
