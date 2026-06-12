export type ControlType = 'color' | 'text' | 'radius';

export interface Control {
  var: string;
  label: string;
  type: ControlType;
}

export interface ControlGroup {
  id: string;
  label: string;
  advanced?: boolean;
  controls: Control[];
}

export const SCHEMA: ControlGroup[] = [
  {
    id: 'brand',
    label: 'Brand & Action',
    controls: [
      { var: '--color-semantic-action-primary', label: 'Primary', type: 'color' },
      { var: '--color-semantic-action-primary-hover', label: 'Primary hover', type: 'color' },
      { var: '--color-semantic-action-primary-active', label: 'Primary active', type: 'color' },
      { var: '--color-semantic-action-primary-text', label: 'Text on primary', type: 'color' },
      { var: '--color-semantic-border-focus', label: 'Focus ring', type: 'color' },
    ],
  },
  {
    id: 'shape',
    label: 'Shape',
    controls: [
      { var: '--radius-sm', label: 'Radius SM', type: 'radius' },
      { var: '--radius-md', label: 'Radius MD', type: 'radius' },
      { var: '--radius-lg', label: 'Radius LG', type: 'radius' },
      { var: '--radius-full', label: 'Radius Full (pill)', type: 'radius' },
    ],
  },
  {
    id: 'typography',
    label: 'Typography',
    controls: [{ var: '--font-family-sans', label: 'Font family', type: 'text' }],
  },
  {
    id: 'surfaces',
    label: 'Surfaces',
    advanced: true,
    controls: [
      { var: '--color-semantic-background-default', label: 'Background', type: 'color' },
      { var: '--color-semantic-background-subtle', label: 'Subtle background', type: 'color' },
      { var: '--color-semantic-background-raised', label: 'Raised background', type: 'color' },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    advanced: true,
    controls: [
      { var: '--color-semantic-text-default', label: 'Default', type: 'color' },
      { var: '--color-semantic-text-muted', label: 'Muted', type: 'color' },
      { var: '--color-semantic-text-subtle', label: 'Subtle', type: 'color' },
    ],
  },
  {
    id: 'borders',
    label: 'Borders',
    advanced: true,
    controls: [
      { var: '--color-semantic-border-default', label: 'Default', type: 'color' },
      { var: '--color-semantic-border-strong', label: 'Strong', type: 'color' },
      { var: '--color-semantic-border-muted', label: 'Muted', type: 'color' },
    ],
  },
  {
    id: 'success',
    label: 'Success',
    advanced: true,
    controls: [
      { var: '--color-semantic-status-success-foreground', label: 'Foreground', type: 'color' },
      { var: '--color-semantic-status-success-background', label: 'Background', type: 'color' },
      { var: '--color-semantic-status-success-border', label: 'Border', type: 'color' },
      { var: '--color-semantic-status-success-bright', label: 'Bright', type: 'color' },
    ],
  },
  {
    id: 'warning',
    label: 'Warning',
    advanced: true,
    controls: [
      { var: '--color-semantic-status-warning-foreground', label: 'Foreground', type: 'color' },
      { var: '--color-semantic-status-warning-background', label: 'Background', type: 'color' },
      { var: '--color-semantic-status-warning-border', label: 'Border', type: 'color' },
      { var: '--color-semantic-status-warning-bright', label: 'Bright', type: 'color' },
    ],
  },
  {
    id: 'danger',
    label: 'Danger',
    advanced: true,
    controls: [
      { var: '--color-semantic-status-danger-foreground', label: 'Foreground', type: 'color' },
      { var: '--color-semantic-status-danger-background', label: 'Background', type: 'color' },
      { var: '--color-semantic-status-danger-border', label: 'Border', type: 'color' },
      { var: '--color-semantic-status-danger-bright', label: 'Bright', type: 'color' },
    ],
  },
];
