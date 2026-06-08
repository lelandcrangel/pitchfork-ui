import { forwardRef, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useOutsideInteraction,
  usePresence,
} from '../../hooks';
import { cx } from '../../utils/cx';
import { FieldWrapper } from '../../utils/FieldWrapper';
import { Icon } from '../Icon';
import './Combobox.css';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange'
> {
  options: ComboboxOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  /** Message shown when no options match the query. */
  emptyMessage?: string;
  name?: string;
  required?: boolean;
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  {
    id,
    options,
    value,
    defaultValue,
    onValueChange,
    label,
    description,
    error,
    placeholder = 'Search…',
    emptyMessage = 'No matches',
    name,
    required,
    className,
    disabled,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const listboxId = `${fieldId}-listbox`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = composeDescribedBy(ariaDescribedBy, descriptionId, errorId);

  const [selectedValue, setSelectedValue] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '',
    onChange: onValueChange,
  });
  const selectedOption = options.find((option) => option.value === selectedValue);

  const [query, setQuery] = useState(() => selectedOption?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const inputRefs = useComposedRefs(inputRef, ref);
  const { isMounted, isExiting } = usePresence(isOpen, 160);

  const menuStyle = useAnchoredPosition({
    anchorRef: rootRef,
    floatingRef: listboxRef,
    enabled: isOpen,
    matchAnchorWidth: true,
    flip: true,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromSelection = selectedOption && query === selectedOption.label;
    if (!q || fromSelection) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query, selectedOption]);

  useOutsideInteraction({
    refs: [rootRef, listboxRef],
    enabled: isOpen,
    onInteractOutside: () => closeAndRevert(),
  });

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(0);
  };

  const closeAndRevert = () => {
    setIsOpen(false);
    setQuery(selectedOption?.label ?? '');
  };

  const selectOption = (option: ComboboxOption) => {
    if (option.disabled) return;
    setSelectedValue(option.value);
    setQuery(option.label);
    setIsOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;

    if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
      return;
    }

    if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      if (isOpen) {
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      return;
    }

    if (event.key === Keys.Enter) {
      if (isOpen && filtered[activeIndex]) {
        event.preventDefault();
        selectOption(filtered[activeIndex]);
      }
      return;
    }

    if (event.key === Keys.Escape) {
      if (isOpen) {
        event.preventDefault();
        closeAndRevert();
      }
    }
  };

  const activeOptionId =
    isOpen && filtered[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <FieldWrapper
      labelFor={fieldId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      error={error}
      errorId={errorId}
      required={required}
    >
      <div className="pf-combobox" ref={rootRef}>
        <div className={cx('pf-combobox__control', error && 'pf-combobox__control--invalid')}>
          <input
            {...props}
            id={fieldId}
            ref={inputRefs}
            type="text"
            role="combobox"
            className={cx('pf-combobox__input', className)}
            value={query}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete="off"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            aria-describedby={describedBy}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onClick={open}
            onKeyDown={onKeyDown}
          />
          <span
            aria-hidden
            className={cx('pf-combobox__icon', isOpen && 'pf-combobox__icon--open')}
          >
            <Icon name="chevron-down" aria-hidden />
          </span>
        </div>

        {name ? <input type="hidden" name={name} value={selectedValue} /> : null}

        {isMounted && typeof document !== 'undefined'
          ? createPortal(
              <ul
                id={listboxId}
                ref={listboxRef}
                role="listbox"
                className={cx('pf-combobox__menu', isExiting && 'pf-combobox__menu--exiting')}
                style={menuStyle}
                aria-label={label}
              >
                {filtered.length === 0 ? (
                  <li className="pf-combobox__empty" role="presentation">
                    {emptyMessage}
                  </li>
                ) : (
                  filtered.map((option, index) => {
                    const isSelected = option.value === selectedValue;
                    const isActive = index === activeIndex;
                    return (
                      <li
                        key={option.value}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled ? true : undefined}
                        className={cx(
                          'pf-combobox__option',
                          isSelected && 'pf-combobox__option--selected',
                          isActive && 'pf-combobox__option--active',
                          option.disabled && 'pf-combobox__option--disabled',
                        )}
                        onMouseEnter={() => {
                          if (!option.disabled) setActiveIndex(index);
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectOption(option)}
                      >
                        {option.label}
                      </li>
                    );
                  })
                )}
              </ul>,
              document.body,
            )
          : null}
      </div>
    </FieldWrapper>
  );
});

Combobox.displayName = 'Combobox';
