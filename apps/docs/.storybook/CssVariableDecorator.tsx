import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

interface CssVariableControl {
  name: string;
  label: string;
  defaultValue: string;
  type?: 'color' | 'text';
  scopes: Array<
    | 'button'
    | 'input'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'avatar'
    | 'status'
    | 'badge'
    | 'tag'
    | 'utility'
  >;
  variants?: string[];
}

interface ColorOption {
  label: string;
  value: string;
  swatch: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { label: 'Base White', value: 'var(--color-base-white)', swatch: 'var(--color-base-white)' },
  { label: 'Base Black', value: 'var(--color-base-black)', swatch: 'var(--color-base-black)' },
  { label: 'Gray 100', value: 'var(--color-gray-100)', swatch: 'var(--color-gray-100)' },
  { label: 'Gray 300', value: 'var(--color-gray-300)', swatch: 'var(--color-gray-300)' },
  { label: 'Gray 500', value: 'var(--color-gray-500)', swatch: 'var(--color-gray-500)' },
  { label: 'Gray 700', value: 'var(--color-gray-700)', swatch: 'var(--color-gray-700)' },
  { label: 'Gray 900', value: 'var(--color-gray-900)', swatch: 'var(--color-gray-900)' },
  { label: 'Brand 400', value: 'var(--color-brand-400)', swatch: 'var(--color-brand-400)' },
  { label: 'Brand 500', value: 'var(--color-brand-500)', swatch: 'var(--color-brand-500)' },
  { label: 'Brand 600', value: 'var(--color-brand-600)', swatch: 'var(--color-brand-600)' },
  { label: 'Brand 50', value: 'var(--color-brand-50)', swatch: 'var(--color-brand-50)' },
  { label: 'Brand 100', value: 'var(--color-brand-100)', swatch: 'var(--color-brand-100)' },
  { label: 'Brand 200', value: 'var(--color-brand-200)', swatch: 'var(--color-brand-200)' },
  { label: 'Brand 300', value: 'var(--color-brand-300)', swatch: 'var(--color-brand-300)' },
  { label: 'Brand 700', value: 'var(--color-brand-700)', swatch: 'var(--color-brand-700)' },
  { label: 'Brand 800', value: 'var(--color-brand-800)', swatch: 'var(--color-brand-800)' },
  { label: 'Danger 100', value: 'var(--color-danger-100)', swatch: 'var(--color-danger-100)' },
  { label: 'Success 400', value: 'var(--color-success-400)', swatch: 'var(--color-success-400)' },
  { label: 'Success 500', value: 'var(--color-success-500)', swatch: 'var(--color-success-500)' },
  { label: 'Success 600', value: 'var(--color-success-600)', swatch: 'var(--color-success-600)' },
  { label: 'Warning 400', value: 'var(--color-warning-400)', swatch: 'var(--color-warning-400)' },
  { label: 'Warning 500', value: 'var(--color-warning-500)', swatch: 'var(--color-warning-500)' },
  { label: 'Warning 600', value: 'var(--color-warning-600)', swatch: 'var(--color-warning-600)' },
  { label: 'Danger 400', value: 'var(--color-danger-400)', swatch: 'var(--color-danger-400)' },
  { label: 'Danger 500', value: 'var(--color-danger-500)', swatch: 'var(--color-danger-500)' },
  { label: 'Danger 600', value: 'var(--color-danger-600)', swatch: 'var(--color-danger-600)' },
  {
    label: 'Semantic Action Primary',
    value: 'var(--color-semantic-action-primary)',
    swatch: 'var(--color-semantic-action-primary)',
  },
  {
    label: 'Semantic Action Primary Hover',
    value: 'var(--color-semantic-action-primary-hover)',
    swatch: 'var(--color-semantic-action-primary-hover)',
  },
  {
    label: 'Semantic Action Primary Text',
    value: 'var(--color-semantic-action-primary-text)',
    swatch: 'var(--color-semantic-action-primary-text)',
  },
  {
    label: 'Semantic Text Default',
    value: 'var(--color-semantic-text-default)',
    swatch: 'var(--color-semantic-text-default)',
  },
  {
    label: 'Semantic Text Muted',
    value: 'var(--color-semantic-text-muted)',
    swatch: 'var(--color-semantic-text-muted)',
  },
  {
    label: 'Semantic Border Default',
    value: 'var(--color-semantic-border-default)',
    swatch: 'var(--color-semantic-border-default)',
  },
  {
    label: 'Semantic Border Strong',
    value: 'var(--color-semantic-border-strong)',
    swatch: 'var(--color-semantic-border-strong)',
  },
  {
    label: 'Semantic Background Default',
    value: 'var(--color-semantic-background-default)',
    swatch: 'var(--color-semantic-background-default)',
  },
  {
    label: 'Semantic Background Subtle',
    value: 'var(--color-semantic-background-subtle)',
    swatch: 'var(--color-semantic-background-subtle)',
  },
];

const CSS_VARIABLE_CONTROLS: CssVariableControl[] = [
  {
    name: '--pf-button-primary-bg',
    label: 'Button primary bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-primary-bg-hover',
    label: 'Button primary hover bg',
    defaultValue: 'var(--color-semantic-action-primary-hover)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-primary-text',
    label: 'Button primary text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['button'],
    variants: ['primary'],
  },
  {
    name: '--pf-button-secondary-bg',
    label: 'Button secondary bg',
    defaultValue: 'var(--color-semantic-background-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-secondary-border',
    label: 'Button secondary border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-secondary-text',
    label: 'Button secondary text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['secondary'],
  },
  {
    name: '--pf-button-ghost-text',
    label: 'Button ghost text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['button'],
    variants: ['ghost'],
  },
  {
    name: '--pf-button-ghost-bg-hover',
    label: 'Button ghost hover bg',
    defaultValue: 'var(--color-semantic-background-subtle)',
    type: 'color',
    scopes: ['button'],
    variants: ['ghost'],
  },
  {
    name: '--pf-checkbox-checked-bg',
    label: 'Checkbox checked background',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-checkbox-label-text',
    label: 'Checkbox label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-checkbox-focus-ring',
    label: 'Checkbox focus ring shadow',
    defaultValue: 'var(--pf-focus-ring)',
    type: 'text',
    scopes: ['checkbox'],
  },
  {
    name: '--pf-radio-checked-color',
    label: 'Radio checked color',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['radio'],
  },
  {
    name: '--pf-radio-label-text',
    label: 'Radio label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['radio'],
  },
  {
    name: '--pf-radio-focus-ring',
    label: 'Radio focus ring shadow',
    defaultValue: 'var(--pf-focus-ring)',
    type: 'text',
    scopes: ['radio'],
  },
  {
    name: '--pf-switch-track-bg',
    label: 'Switch track bg',
    defaultValue: 'var(--color-gray-300)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-track-checked-bg',
    label: 'Switch checked track bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-thumb-bg',
    label: 'Switch thumb bg',
    defaultValue: 'var(--color-base-white)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-label-text',
    label: 'Switch label text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['switch'],
  },
  {
    name: '--pf-switch-focus-ring',
    label: 'Switch focus ring shadow',
    defaultValue: 'var(--pf-focus-ring)',
    type: 'text',
    scopes: ['switch'],
  },
  {
    name: '--pf-avatar-bg',
    label: 'Avatar background',
    defaultValue: 'var(--pf-surface-subtle)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-border',
    label: 'Avatar border',
    defaultValue: 'var(--pf-surface-border)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-color-semantic-text-default',
    label: 'Avatar text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-border',
    label: 'Avatar status border',
    defaultValue: 'var(--pf-surface-bg)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-size',
    label: 'Avatar status size',
    defaultValue: '10px',
    type: 'text',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-offset',
    label: 'Avatar status offset',
    defaultValue: '-2px',
    type: 'text',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-status-online-color',
    label: 'Avatar status online',
    defaultValue: '#16a34a',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-color-semantic-status-warning-foreground',
    label: 'Avatar status away',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-color-semantic-status-danger-foreground',
    label: 'Avatar status busy',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-avatar-color-semantic-text-muted',
    label: 'Avatar status offline',
    defaultValue: 'var(--color-semantic-text-muted)',
    type: 'color',
    scopes: ['avatar'],
  },
  {
    name: '--pf-input-border',
    label: 'Input border',
    defaultValue: 'var(--color-semantic-border-default)',
    type: 'color',
    scopes: ['input', 'select'],
  },
  {
    name: '--pf-input-text',
    label: 'Input text',
    defaultValue: 'var(--color-semantic-text-default)',
    type: 'color',
    scopes: ['input', 'select'],
  },
  {
    name: '--pf-select-option-active-bg',
    label: 'Select active option bg',
    defaultValue: 'var(--color-semantic-action-primary)',
    type: 'color',
    scopes: ['select'],
  },
  {
    name: '--pf-select-option-active-text',
    label: 'Select active option text',
    defaultValue: 'var(--color-semantic-action-primary-text)',
    type: 'color',
    scopes: ['select'],
  },
  {
    name: '--pf-focus-ring',
    label: 'Focus ring shadow',
    defaultValue: '0 0 0 3px rgb(59 130 246 / 0.35)',
    type: 'text',
    scopes: [
      'button',
      'input',
      'select',
      'checkbox',
      'radio',
      'switch',
      'avatar',
      'status',
      'badge',
      'tag',
      'utility',
    ],
  },
  {
    name: '--pf-badge-neutral-bg',
    label: 'Badge neutral bg',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['badge'],
    variants: ['neutral'],
  },
  {
    name: '--pf-badge-neutral-text',
    label: 'Badge neutral text',
    defaultValue: 'var(--color-gray-700)',
    type: 'color',
    scopes: ['badge'],
    variants: ['neutral'],
  },
  {
    name: '--pf-badge-brand-bg',
    label: 'Badge brand bg',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['badge'],
    variants: ['brand'],
  },
  {
    name: '--pf-badge-brand-text',
    label: 'Badge brand text',
    defaultValue: 'var(--color-brand-700)',
    type: 'color',
    scopes: ['badge'],
    variants: ['brand'],
  },
  {
    name: '--pf-badge-success-bg',
    label: 'Badge success bg',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['badge'],
    variants: ['success'],
  },
  {
    name: '--pf-badge-success-text',
    label: 'Badge success text',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['badge'],
    variants: ['success'],
  },
  {
    name: '--pf-badge-warning-bg',
    label: 'Badge warning bg',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['badge'],
    variants: ['warning'],
  },
  {
    name: '--pf-badge-warning-text',
    label: 'Badge warning text',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['badge'],
    variants: ['warning'],
  },
  {
    name: '--color-brand-50',
    label: 'Alert info bg (brand-50)',
    defaultValue: 'var(--color-brand-50)',
    type: 'color',
    scopes: ['status'],
    variants: ['info'],
  },
  {
    name: '--color-brand-100',
    label: 'Brand 100',
    defaultValue: 'var(--color-brand-100)',
    type: 'color',
    scopes: ['status', 'badge', 'tag', 'utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-200',
    label: 'Brand 200',
    defaultValue: 'var(--color-brand-200)',
    type: 'color',
    scopes: ['utility'],
    variants: ['brand'],
  },
  {
    name: '--color-brand-300',
    label: 'Alert info border (brand-300)',
    defaultValue: 'var(--color-brand-300)',
    type: 'color',
    scopes: ['status', 'utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-700',
    label: 'Brand 700',
    defaultValue: 'var(--color-brand-700)',
    type: 'color',
    scopes: ['status', 'badge', 'tag', 'utility'],
    variants: ['info', 'brand'],
  },
  {
    name: '--color-brand-800',
    label: 'Alert info text (brand-800)',
    defaultValue: 'var(--color-brand-800)',
    type: 'color',
    scopes: ['status'],
    variants: ['info'],
  },
  {
    name: '--color-gray-100',
    label: 'Gray 100',
    defaultValue: 'var(--color-gray-100)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['neutral'],
  },
  {
    name: '--color-gray-700',
    label: 'Gray 700',
    defaultValue: 'var(--color-gray-700)',
    type: 'color',
    scopes: ['badge', 'tag'],
    variants: ['neutral'],
  },
  {
    name: '--color-semantic-status-success-background',
    label: 'Success background',
    defaultValue: 'var(--color-semantic-status-success-background)',
    type: 'color',
    scopes: ['status', 'badge', 'tag'],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-success-border',
    label: 'Success border',
    defaultValue: 'var(--color-semantic-status-success-border)',
    type: 'color',
    scopes: ['status'],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-success-foreground',
    label: 'Success foreground',
    defaultValue: 'var(--color-semantic-status-success-foreground)',
    type: 'color',
    scopes: ['status', 'badge', 'tag'],
    variants: ['success'],
  },
  {
    name: '--color-semantic-status-warning-background',
    label: 'Warning background',
    defaultValue: 'var(--color-semantic-status-warning-background)',
    type: 'color',
    scopes: ['status', 'badge', 'tag'],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-warning-border',
    label: 'Warning border',
    defaultValue: 'var(--color-semantic-status-warning-border)',
    type: 'color',
    scopes: ['status'],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-warning-foreground',
    label: 'Warning foreground',
    defaultValue: 'var(--color-semantic-status-warning-foreground)',
    type: 'color',
    scopes: ['status', 'badge', 'tag'],
    variants: ['warning'],
  },
  {
    name: '--color-semantic-status-danger-background',
    label: 'Danger background',
    defaultValue: 'var(--color-semantic-status-danger-background)',
    type: 'color',
    scopes: ['status', 'utility'],
    variants: ['danger'],
  },
  {
    name: '--color-semantic-status-danger-border',
    label: 'Danger border',
    defaultValue: 'var(--color-semantic-status-danger-border)',
    type: 'color',
    scopes: ['status', 'utility'],
    variants: ['danger'],
  },
  {
    name: '--color-semantic-status-danger-foreground',
    label: 'Danger foreground',
    defaultValue: 'var(--color-semantic-status-danger-foreground)',
    type: 'color',
    scopes: ['status', 'utility'],
    variants: ['danger'],
  },
  {
    name: '--color-danger-100',
    label: 'Danger 100',
    defaultValue: 'var(--color-danger-100)',
    type: 'color',
    scopes: ['utility'],
    variants: ['danger'],
  },
];

function CssVariableController({
  children,
  controls,
}: {
  children: ReactNode;
  controls: CssVariableControl[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const scopedVars = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value && value.trim().length > 0),
  );

  useEffect(() => {
    const allowedNames = new Set(controls.map((control) => control.name));
    setValues((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([name]) => allowedNames.has(name)),
      ),
    );
  }, [controls]);

  return (
    <>
      <div style={scopedVars as CSSProperties}>{children}</div>

      {typeof document !== 'undefined'
        ? createPortal(
            <div
              style={{
                position: 'fixed',
                right: '16px',
                bottom: '16px',
                zIndex: 9999,
                width: isOpen ? '320px' : 'auto',
                maxHeight: '60vh',
                overflow: 'auto',
                borderRadius: '10px',
                border: '1px solid var(--color-semantic-border-default)',
                background: 'var(--color-semantic-background-default)',
                boxShadow: 'var(--pf-elevation-popover-shadow)',
                padding: isOpen ? '12px' : '0',
              }}
            >
              {isOpen ? (
                <div>
                  <div
                    style={{
                      alignItems: 'center',
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <strong style={{ fontSize: '13px' }}>CSS Variable Controls</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      style={{
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        color: 'var(--color-semantic-text-default)',
                        fontSize: '12px',
                      }}
                    >
                      Close
                    </button>
                  </div>

                  <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                    <legend className="pf-sr-only">Global CSS variable controls</legend>
                    {controls.map((control) => {
                      const inputId = `global-css-var-${control.name.replace(/[^a-z0-9-]/gi, '-')}`;
                      return (
                        <div
                          key={control.name}
                          style={{ display: 'grid', gap: '4px', marginBottom: '10px' }}
                        >
                          <label htmlFor={inputId} style={{ fontSize: '12px' }}>
                            {control.label}
                          </label>
                          <code style={{ fontSize: '11px', color: 'var(--color-semantic-text-muted)' }}>
                            {control.name}
                          </code>
                          {control.type === 'color' ? (
                            <ColorSelect
                              id={inputId}
                              value={values[control.name] ?? control.defaultValue}
                              onChange={(nextValue) => {
                                setValues((current) => {
                                  if (nextValue === control.defaultValue) {
                                    const { [control.name]: _removed, ...rest } = current;
                                    return rest;
                                  }
                                  return {
                                    ...current,
                                    [control.name]: nextValue,
                                  };
                                });
                              }}
                            />
                          ) : (
                            <input
                              id={inputId}
                              type="text"
                              value={values[control.name] ?? control.defaultValue}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                setValues((current) => {
                                  if (nextValue === control.defaultValue) {
                                    const { [control.name]: _removed, ...rest } = current;
                                    return rest;
                                  }
                                  return {
                                    ...current,
                                    [control.name]: nextValue,
                                  };
                                });
                              }}
                              style={{
                                minHeight: '32px',
                                border: '1px solid var(--color-semantic-border-default)',
                                borderRadius: '6px',
                                padding: '0 8px',
                                fontFamily: 'var(--font-family-mono)',
                                fontSize: '12px',
                                color: 'var(--color-semantic-text-default)',
                                background: 'var(--color-semantic-background-default)',
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </fieldset>

                  <button
                    type="button"
                    onClick={() => {
                      setValues({});
                    }}
                    style={{
                      width: '100%',
                      minHeight: '34px',
                      border: '1px solid var(--color-semantic-border-default)',
                      borderRadius: '6px',
                      background: 'var(--color-semantic-background-subtle)',
                      color: 'var(--color-semantic-text-default)',
                      cursor: 'pointer',
                    }}
                  >
                    Reset defaults
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                  }}
                  style={{
                    minHeight: '34px',
                    border: '1px solid var(--color-semantic-border-default)',
                    borderRadius: '8px',
                    background: 'var(--color-semantic-background-default)',
                    color: 'var(--color-semantic-text-default)',
                    cursor: 'pointer',
                    padding: '0 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  CSS Variables
                </button>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function ColorSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedOption =
    COLOR_OPTIONS.find((option) => option.value === value) ?? {
      label: value,
      value,
      swatch: value,
    };

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!wrapperRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        id={id}
        type="button"
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '8px',
          minHeight: '32px',
          width: '100%',
          border: '1px solid var(--color-semantic-border-default)',
          borderRadius: '6px',
          padding: '0 8px',
          fontSize: '12px',
          color: 'var(--color-semantic-text-default)',
          background: 'var(--color-semantic-background-default)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span
          aria-hidden
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '999px',
            border: '1px solid var(--color-semantic-border-default)',
            background: selectedOption.swatch,
            flexShrink: 0,
          }}
        />
        <span style={{ flexGrow: 1 }}>{selectedOption.label}</span>
        <span aria-hidden style={{ color: 'var(--color-semantic-text-muted)' }}>
          v
        </span>
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label="Color options"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            marginTop: '4px',
            maxHeight: '180px',
            overflow: 'auto',
            border: '1px solid var(--color-semantic-border-default)',
            borderRadius: '8px',
            background: 'var(--color-semantic-background-default)',
            boxShadow: 'var(--pf-elevation-popover-shadow)',
          }}
        >
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: '8px',
                width: '100%',
                border: 0,
                borderBottom: '1px solid var(--color-semantic-border-default)',
                background:
                  option.value === value
                    ? 'var(--color-semantic-background-subtle)'
                    : 'var(--color-semantic-background-default)',
                color: 'var(--color-semantic-text-default)',
                cursor: 'pointer',
                padding: '7px 8px',
                fontSize: '12px',
                textAlign: 'left',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '999px',
                  border: '1px solid var(--color-semantic-border-default)',
                  background: option.swatch,
                  flexShrink: 0,
                }}
              />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const scopeByStoryTitle: Record<
  string,
  Array<
    | 'button'
    | 'input'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'avatar'
    | 'status'
    | 'badge'
    | 'tag'
    | 'utility'
  >
> = {
  'Components/Button': ['button'],
  'Components/Input': ['input'],
  'Components/Select': ['select'],
  'Components/Checkbox': ['checkbox'],
  'Components/RadioButton': ['radio'],
  'Components/Switch': ['switch'],
  'Components/Avatar': ['avatar'],
  'Components/Alert': ['status'],
  'Components/Notification': ['status'],
  'Components/InlineCTA': ['status'],
  'Components/Badge': ['badge'],
  'Components/BadgeGroup': ['badge'],
  'Components/Tag': ['tag'],
  'Components/UtilityButton': ['utility'],
};

export function withCssVariableControls(
  Story: () => ReactNode,
  context: {
    viewMode?: string;
    name?: string;
    title?: string;
    id?: string;
    args?: { variant?: string };
  },
) {
  const isInteractiveStory =
    (context.viewMode === 'story' && context.name === 'Interactive') ||
    context.id?.endsWith('--interactive');
  const isComponentStory = Boolean(context.title?.startsWith('Components/'));
  const mappedScopes = context.title ? scopeByStoryTitle[context.title] ?? [] : [];
  const activeScopes: Array<
    | 'button'
    | 'input'
    | 'select'
    | 'checkbox'
    | 'radio'
    | 'switch'
    | 'avatar'
    | 'status'
    | 'badge'
    | 'tag'
    | 'utility'
  > = mappedScopes;
  const activeVariant = context.args?.variant;

  const controls = CSS_VARIABLE_CONTROLS.filter((control) =>
    control.scopes.some((scope) => activeScopes.includes(scope)) &&
    (!control.variants ||
      (typeof activeVariant === 'string' && control.variants.includes(activeVariant))),
  );

  if (!isInteractiveStory || !isComponentStory || controls.length === 0) {
    return <Story />;
  }

  return (
    <CssVariableController controls={controls}>
      <Story />
    </CssVariableController>
  );
}
