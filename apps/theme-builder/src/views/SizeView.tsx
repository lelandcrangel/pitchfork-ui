import {
  PfBadge,
  PfButton,
  PfCard,
  PfCardContent,
  PfCardHeader,
  PfCheckbox,
  PfInput,
  PfTag,
} from '@pitchfork-ui/elements-react';
/*
 * TODO(pitchfork-ui): still on @pitchfork-ui/react, which is being retired.
 * Each of these needs the call site reshaped by hand -- see Foundations/Migrating in Storybook.
 *
 * - Select: the call site changes shape: options -> child elements; onValueChange -> no matching event on pf-select; pick the right one
 * - Slider: an event prop has no equivalent on `pf-slider`: onValueChange -> no matching event on pf-slider; pick the right one
 * - UtilityButton: the call site changes shape: icon -> slot
 */
import { Select, Slider, UtilityButton } from '@pitchfork-ui/react';
import { useState } from 'react';
import type { ThemeState } from '../hooks/useTheme';
import '../styles/controls.css';
import './SizeView.css';

interface SizeViewProps {
  theme: ThemeState;
}

export function SizeView({ theme }: SizeViewProps) {
  return (
    <div className="view-layout">
      <div className="view-layout__editor">
        <div className="size-editor">
          <div className="editor-section">
            <div className="editor-section__label">Border Radius</div>
            <RadiusControl
              label="SM"
              cssVar="--radius-sm"
              theme={theme}
              max={20}
              hint="Badges, tags, inputs"
            />
            <RadiusControl
              label="MD"
              cssVar="--radius-md"
              theme={theme}
              max={24}
              hint="Buttons, cards, dropdowns"
            />
            <RadiusControl
              label="LG"
              cssVar="--radius-lg"
              theme={theme}
              max={32}
              hint="Modals, large panels"
            />
            <RadiusControl
              label="Full"
              cssVar="--radius-full"
              theme={theme}
              max={32}
              hint="Pill buttons, pill badges"
              isFull
            />
          </div>

          <div className="editor-section">
            <div className="editor-section__label">Spacing</div>
            <div className="size-editor__spacing-note">
              These tokens drive all component padding and gaps. Adjust together to change overall
              density.
            </div>
            <SpacingControl
              label="XS"
              cssVar="--space-2"
              theme={theme}
              max={20}
              hint="Badge padding, icon gap"
            />
            <SpacingControl
              label="SM"
              cssVar="--space-3"
              theme={theme}
              max={28}
              hint="Button & input padding"
            />
            <SpacingControl
              label="MD"
              cssVar="--space-4"
              theme={theme}
              max={40}
              hint="Card & section padding"
            />
          </div>
        </div>
      </div>
      <div className="view-layout__canvas">
        <SizeCanvas />
      </div>
    </div>
  );
}

interface RadiusControlProps {
  label: string;
  cssVar: string;
  theme: ThemeState;
  max: number;
  hint: string;
  isFull?: boolean;
}

function RadiusControl({ label, cssVar, theme, max, hint, isFull }: RadiusControlProps) {
  const value = theme.getValue(cssVar);
  const px = parsePx(value, isFull);
  const modified = theme.isModified(cssVar);
  const displayValue = isFull && px >= max ? 'pill' : `${px}px`;
  const cssValue = isFull && px >= max ? '9999px' : `${px}px`;

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <div className="size-control__preview-wrap">
          <div className="size-control__radius-preview" style={{ borderRadius: cssValue }} />
        </div>
        <div className="size-control__meta">
          <span className="control__label">{label}</span>
          <span className="size-control__hint">{hint}</span>
        </div>
        <span className="control__value">{displayValue}</span>
        {modified && (
          <UtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            aria-label={`Reset ${label}`}
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
        onValueChange={(n) => theme.set(cssVar, isFull && n >= max ? '9999px' : `${n}px`)}
        aria-label={label}
      />
    </div>
  );
}

interface SpacingControlProps {
  label: string;
  cssVar: string;
  theme: ThemeState;
  max: number;
  hint: string;
}

function SpacingControl({ label, cssVar, theme, max, hint }: SpacingControlProps) {
  const value = theme.getValue(cssVar);
  const px = remToPx(value);
  const modified = theme.isModified(cssVar);

  return (
    <div className={`control ${modified ? 'control--modified' : ''}`}>
      <div className="control__row">
        <div className="size-control__preview-wrap">
          <div className="size-control__space-preview">
            <div
              className="size-control__space-bar"
              style={{ width: `${Math.min(px * 2, 40)}px` }}
            />
          </div>
        </div>
        <div className="size-control__meta">
          <span className="control__label">{label}</span>
          <span className="size-control__hint">{hint}</span>
        </div>
        <span className="control__value">{px}px</span>
        {modified && (
          <UtilityButton
            size="sm"
            onClick={() => theme.resetVar(cssVar)}
            aria-label={`Reset ${label}`}
          >
            ↺
          </UtilityButton>
        )}
      </div>
      <Slider
        min={0}
        max={max}
        step={1}
        value={px}
        onValueChange={(n) => theme.set(cssVar, `${+(n / 16).toFixed(4)}rem`)}
        aria-label={label}
      />
    </div>
  );
}

const BADGE_VARIANTS = ['neutral', 'brand', 'success', 'warning', 'danger'] as const;
const TAG_VARIANTS = ['neutral', 'brand', 'success', 'warning', 'danger'] as const;

const FORM_OPTIONS = [
  { value: 'design', label: 'Design system' },
  { value: 'tokens', label: 'Token studio' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'figma', label: 'Figma plugin' },
];

function SizeCanvas() {
  const [checked1, setChecked1] = useState(true);
  const [checked2, setChecked2] = useState(false);
  const [selectVal, setSelectVal] = useState('design');
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="size-canvas">
      <div className="size-canvas__grid">
        {/* Shape scale */}
        <PfCard>
          <PfCardHeader>
            <div className="size-canvas__section-header">
              <span className="size-canvas__section-title">Shape scale</span>
              <span className="size-canvas__token-group">
                <code className="size-canvas__token-badge">--radius-sm</code>
                <code className="size-canvas__token-badge">--radius-md</code>
                <code className="size-canvas__token-badge">--radius-lg</code>
                <code className="size-canvas__token-badge">--radius-full</code>
              </span>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <div className="size-canvas__shape-row">
              {(
                [
                  { token: '--radius-sm', label: 'SM' },
                  { token: '--radius-md', label: 'MD' },
                  { token: '--radius-lg', label: 'LG' },
                  { token: '--radius-full', label: 'Full' },
                ] as const
              ).map(({ token, label }) => (
                <div key={token} className="size-canvas__shape-item">
                  <div
                    className="size-canvas__shape-tile"
                    style={{ borderRadius: `var(${token})` }}
                  />
                  <code className="size-canvas__shape-label">{label}</code>
                </div>
              ))}
            </div>
          </PfCardContent>
        </PfCard>

        {/* Buttons — radius-md + space-2/3/4 */}
        <PfCard>
          <PfCardHeader>
            <div className="size-canvas__section-header">
              <span className="size-canvas__section-title">Buttons</span>
              <span className="size-canvas__token-group">
                <code className="size-canvas__token-badge">--radius-md</code>
                <code className="size-canvas__token-badge">--space-2 –4</code>
              </span>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="size-canvas__row">
              <PfButton size="sm">Small</PfButton>
              <PfButton size="md">Medium</PfButton>
              <PfButton size="lg">Large</PfButton>
            </div>
            <div className="size-canvas__row">
              <PfButton variant="secondary" size="md">
                Secondary
              </PfButton>
              <PfButton variant="ghost" size="md">
                Ghost
              </PfButton>
              <PfButton
                size="md"
                style={{ borderRadius: 'var(--radius-full)' } as React.CSSProperties}
              >
                Pill
              </PfButton>
            </div>
          </PfCardContent>
        </PfCard>

        {/* Form controls — radius-md + space-3 */}
        <PfCard>
          <PfCardHeader>
            <div className="size-canvas__section-header">
              <span className="size-canvas__section-title">Form controls</span>
              <span className="size-canvas__token-group">
                <code className="size-canvas__token-badge">--radius-md</code>
                <code className="size-canvas__token-badge">--space-3</code>
              </span>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <PfInput
              label="Project name"
              placeholder="My design system"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <Select
              label="Tool"
              options={FORM_OPTIONS}
              value={selectVal}
              onValueChange={setSelectVal}
            />
            <div className="size-canvas__checkbox-row">
              <PfCheckbox
                label="Enable dark mode"
                checked={checked1}
                onChange={(e) => setChecked1(e.target.checked)}
              />
              <PfCheckbox
                label="Auto-publish on save"
                checked={checked2}
                onChange={(e) => setChecked2(e.target.checked)}
              />
            </div>
          </PfCardContent>
        </PfCard>

        {/* Badges & Tags — radius-sm + space-2 */}
        <PfCard>
          <PfCardHeader>
            <div className="size-canvas__section-header">
              <span className="size-canvas__section-title">Badges &amp; Tags</span>
              <span className="size-canvas__token-group">
                <code className="size-canvas__token-badge">--radius-sm</code>
                <code className="size-canvas__token-badge">--space-2</code>
              </span>
            </div>
          </PfCardHeader>
          <PfCardContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="size-canvas__row size-canvas__row--wrap">
              {BADGE_VARIANTS.map((v) => (
                <PfBadge key={v} variant={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </PfBadge>
              ))}
            </div>
            <div className="size-canvas__row size-canvas__row--wrap">
              {TAG_VARIANTS.map((v) => (
                <PfTag key={v} variant={v}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </PfTag>
              ))}
            </div>
          </PfCardContent>
        </PfCard>

        {/* Card — radius-lg + space-4 */}
        <PfCard>
          <PfCardHeader>
            <div className="size-canvas__section-header">
              <span className="size-canvas__section-title">PfCard</span>
              <span className="size-canvas__token-group">
                <code className="size-canvas__token-badge">--radius-lg</code>
                <code className="size-canvas__token-badge">--space-4</code>
              </span>
            </div>
          </PfCardHeader>
          <PfCardContent>
            <PfCard>
              <PfCardHeader>
                <div className="size-canvas__card-header-row">
                  <strong>Design tokens</strong>
                  <PfBadge variant="brand">New</PfBadge>
                </div>
              </PfCardHeader>
              <PfCardContent>
                <p className="size-canvas__card-text">
                  PfCard corners use <code>--radius-lg</code>. Each section's padding comes from{' '}
                  <code>--space-4</code> — drag that slider to see the internal breathing room
                  change.
                </p>
                <div className="size-canvas__card-actions">
                  <PfButton size="sm" variant="secondary">
                    Cancel
                  </PfButton>
                  <PfButton size="sm">Apply</PfButton>
                </div>
              </PfCardContent>
            </PfCard>
          </PfCardContent>
        </PfCard>
      </div>
    </div>
  );
}

function parsePx(value: string, isFull?: boolean): number {
  if (value === '9999px') return isFull ? 32 : 9999;
  if (value.endsWith('rem')) return Math.round(parseFloat(value) * 16);
  return Math.round(parseFloat(value)) || 0;
}

function remToPx(value: string): number {
  if (value.endsWith('rem')) return Math.round(parseFloat(value) * 16);
  if (value.endsWith('px')) return Math.round(parseFloat(value));
  return 0;
}
