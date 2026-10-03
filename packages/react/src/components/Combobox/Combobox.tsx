import { matchesCommandQuery, queryIsEchoedSelection } from '@pitchfork-ui/core';
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { composeDescribedBy, Keys } from '../../a11y';
import {
  useAnchoredPosition,
  useComposedRefs,
  useControllableState,
  useListNavigation,
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
  /** Show a clear button inside the field when there is a value to clear. Defaults to `true`. */
  clearable?: boolean;
  /** Accessible label for the clear button. Defaults to `"Clear"`. */
  clearLabel?: string;
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
    clearable = true,
    clearLabel = 'Clear',
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

  // Both rules are core's, so `<pf-combobox>` filters the same list from the
  // same keystrokes — including that the label echoed back after a selection
  // does not filter at all.
  const filtered = useMemo(() => {
    if (queryIsEchoedSelection(query, selectedOption?.label)) return options;
    return options.filter((option) => matchesCommandQuery({ label: option.label }, query));
  }, [options, query, selectedOption]);

  /*
   * The same navigation core gives `<pf-combobox>` and `Select`. It replaces
   * `Math.min`/`Math.max` clamping, which stopped at the ends where `Select`
   * next door wrapped -- two arrow behaviours in neighbouring controls of one
   * design system -- and which could leave a *disabled* option active, where
   * Enter then did nothing at all.
   */
  const { activeIndex, firstEnabledIndex, move, setActiveIndex } = useListNavigation({
    items: filtered,
    isDisabled: (option: ComboboxOption) => Boolean(option.disabled),
  });

  /*
   * `filtered` changes with every keystroke, so the active option has to be
   * re-established against the new list rather than against the one the
   * keystroke was typed into -- a `setActiveIndex` in the change handler still
   * sees the previous render's options, and index 0 of those may not even
   * exist in these.
   */
  useEffect(() => {
    if (!isOpen) return;
    setActiveIndex(firstEnabledIndex);
  }, [filtered, firstEnabledIndex, isOpen, setActiveIndex]);

  useOutsideInteraction({
    refs: [rootRef, listboxRef],
    enabled: isOpen,
    onInteractOutside: () => closeAndRevert(),
  });

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(firstEnabledIndex);
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

  // Reset both the query and the committed value, then keep focus and reopen
  // the (now-unfiltered) list so the user can pick again immediately.
  const clear = () => {
    setSelectedValue('');
    setQuery('');
    setActiveIndex(firstEnabledIndex);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const showClear = clearable && !disabled && (query.length > 0 || selectedValue !== '');

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (event) => {
    if (disabled) return;

    if (event.key === Keys.ArrowDown) {
      event.preventDefault();
      if (!isOpen) {
        open();
        return;
      }
      move('next');
      return;
    }

    if (event.key === Keys.ArrowUp) {
      event.preventDefault();
      if (isOpen) {
        move('previous');
      }
      return;
    }

    // Home and End did nothing at all, while `Select` answered both.
    if (event.key === Keys.Home || event.key === Keys.End) {
      if (isOpen) {
        event.preventDefault();
        move(event.key === Keys.Home ? 'first' : 'last');
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
              if (!isOpen) setIsOpen(true);
            }}
            onClick={open}
            onKeyDown={onKeyDown}
          />
          {showClear ? (
            <button
              type="button"
              className="pf-combobox__clear"
              aria-label={clearLabel}
              // Kept out of the tab order so it never interrupts the
              // combobox keyboard flow (Escape still clears/closes).
              tabIndex={-1}
              // Prevent the input from blurring before the click resolves.
              onMouseDown={(event) => event.preventDefault()}
              onClick={clear}
            >
              <Icon name="circle-xmark" aria-hidden />
            </button>
          ) : null}
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
                      // eslint-disable-next-line jsx-a11y/click-events-have-key-events -- aria-activedescendant pattern: keyboard stays on the input, options are mouse targets
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
