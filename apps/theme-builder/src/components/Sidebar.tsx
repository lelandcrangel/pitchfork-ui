import { useState } from 'react';
import { Button, Input, Slider, UtilityButton } from '@pitchfork-ui/react';
import { SCHEMA } from '../tokens/schema';
import type { ThemeState } from '../hooks/useTheme';
import './Sidebar.css';

interface Props {
  theme: ThemeState;
}

export function Sidebar({ theme }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const groups = SCHEMA.filter((g) => showAdvanced || !g.advanced);

  return (
    <aside className="sidebar">
      <div className="sidebar__scroll">
        {groups.map((group) => (
          <div key={group.id} className="sidebar__group">
            <div className="sidebar__group-label">{group.label}</div>
            {group.controls.map((control) => {
              const value = theme.getValue(control.var);
              const modified = theme.isModified(control.var);
              const onReset = () => theme.resetVar(control.var);

              if (control.type === 'color') {
                return (
                  <ColorControl
                    key={control.var}
                    label={control.label}
                    value={value}
                    modified={modified}
                    onChange={(v) => theme.set(control.var, v)}
                    onReset={onReset}
                  />
                );
              }

              if (control.type === 'radius') {
                return (
                  <RadiusControl
                    key={control.var}
                    label={control.label}
                    value={value}
                    modified={modified}
                    onChange={(v) => theme.set(control.var, v)}
                    onReset={onReset}
                    isFull={control.var === '--radius-full'}
                  />
                );
              }

              return (
                <TextControl
                  key={control.var}
                  label={control.label}
                  value={value}
                  modified={modified}
                  onChange={(v) => theme.set(control.var, v)}
                  onReset={onReset}
                />
              );
            })}
          </div>
        ))}

        <div className="sidebar__advanced-row">
          <Button variant="ghost" size="sm" onClick={() => setShowAdvanced((v) => !v)}>
            {showAdvanced ? 'Hide advanced controls' : 'Show advanced controls'}
          </Button>
        </div>
      </div>
    </aside>
  );
}

interface ControlProps {
  label: string;
  value: string;
  modified: boolean;
  onChange: (v: string) => void;
  onReset: () => void;
}

function ColorControl({ label, value, modified, onChange, onReset }: ControlProps) {
  const safeHex = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000';

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        <div className="control__color-inputs">
          <div className="control__swatch-wrap">
            <div className="control__swatch" style={{ background: value }} />
            <input
              type="color"
              className="control__color-picker"
              value={safeHex}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
          <div className="control__hex-wrap">
            <Input
              value={value}
              maxLength={7}
              aria-label={`${label} hex value`}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
              }}
            />
          </div>
        </div>
        {modified && (
          <UtilityButton
            size="sm"
            aria-label="Reset to default"
            onClick={onReset}
            title="Reset to default"
          >
            ↺
          </UtilityButton>
        )}
      </div>
    </div>
  );
}

function RadiusControl({
  label,
  value,
  modified,
  onChange,
  onReset,
  isFull,
}: ControlProps & { isFull: boolean }) {
  const max = isFull ? 100 : 24;
  const px = parsePx(value);
  const displayValue = isFull && px >= max ? 'pill' : `${px}px`;

  return (
    <div className={`control control--radius ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        <span className="control__value">{displayValue}</span>
        {modified && (
          <UtilityButton
            size="sm"
            aria-label="Reset to default"
            onClick={onReset}
            title="Reset to default"
          >
            ↺
          </UtilityButton>
        )}
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={Math.min(px, max)}
        onValueChange={(n) => onChange(isFull && n >= max ? '9999px' : `${n}px`)}
        aria-label={label}
      />
    </div>
  );
}

function TextControl({ label, value, modified, onChange, onReset }: ControlProps) {
  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <label className="control__label">{label}</label>
        {modified && (
          <UtilityButton
            size="sm"
            aria-label="Reset to default"
            onClick={onReset}
            title="Reset to default"
          >
            ↺
          </UtilityButton>
        )}
      </div>
      <div className="control__text-wrap">
        <Input
          value={value}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  );
}

function parsePx(value: string): number {
  if (value === '9999px') return 100;
  if (value.endsWith('rem')) return Math.round(parseFloat(value) * 16);
  return Math.round(parseFloat(value)) || 0;
}
