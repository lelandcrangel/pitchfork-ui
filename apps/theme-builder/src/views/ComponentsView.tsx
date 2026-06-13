import {
  Accordion,
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  BadgeGroup,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Checkbox,
  CodeSnippet,
  Collapsible,
  ContentDivider,
  Dropdown,
  EmptyState,
  Icon,
  Input,
  Kbd,
  LoadingDots,
  LoadingSpinner,
  MetricCard,
  MetricGrid,
  Notification,
  NumberInput,
  PageHeader,
  Pagination,
  ProgressBar,
  ProgressCircle,
  ProgressSteps,
  RadioButton,
  RadioGroup,
  RatingBadge,
  RatingStars,
  Select,
  SectionFooter,
  SectionHeader,
  Slider,
  Switch,
  Table,
  Tabs,
  Tag,
  Textarea,
  Timeline,
  Tooltip,
  TreeView,
  UtilityButton,
} from '@pitchfork-ui/react';
import { type ReactElement, useState } from 'react';
import type { ThemeState } from '../hooks/useTheme';
import '../styles/controls.css';
import './ComponentsView.css';

// ── Types ────────────────────────────────────────────────────────────────────

type VarType = 'color' | 'spacing' | 'other';

interface VarDef {
  var: string;
  label: string;
  type: VarType;
}

interface ComponentDef {
  id: string;
  label: string;
  vars: VarDef[];
}

// ── Manifest ─────────────────────────────────────────────────────────────────
// All components that have --pf-* overrideable CSS variables, sorted A–Z.

const MANIFEST: ComponentDef[] = [
  {
    id: 'accordion',
    label: 'Accordion',
    vars: [
      { var: '--pf-accordion-border', label: 'Border', type: 'color' },
      { var: '--pf-accordion-trigger-text', label: 'Trigger text', type: 'color' },
      { var: '--pf-accordion-trigger-bg-hover', label: 'Trigger hover BG', type: 'color' },
      { var: '--pf-accordion-icon', label: 'Icon color', type: 'color' },
      { var: '--pf-accordion-content-text', label: 'Content text', type: 'color' },
    ],
  },
  {
    id: 'alert',
    label: 'Alert',
    vars: [
      { var: '--pf-alert-border', label: 'Default border', type: 'color' },
      { var: '--pf-alert-info-background', label: 'Info background', type: 'color' },
      { var: '--pf-alert-info-border', label: 'Info border', type: 'color' },
      { var: '--pf-alert-info-foreground', label: 'Info text', type: 'color' },
      { var: '--pf-alert-success-background', label: 'Success background', type: 'color' },
      { var: '--pf-alert-success-border', label: 'Success border', type: 'color' },
      { var: '--pf-alert-success-foreground', label: 'Success text', type: 'color' },
      { var: '--pf-alert-warning-background', label: 'Warning background', type: 'color' },
      { var: '--pf-alert-warning-border', label: 'Warning border', type: 'color' },
      { var: '--pf-alert-warning-foreground', label: 'Warning text', type: 'color' },
      { var: '--pf-alert-danger-background', label: 'Danger background', type: 'color' },
      { var: '--pf-alert-danger-border', label: 'Danger border', type: 'color' },
      { var: '--pf-alert-danger-foreground', label: 'Danger text', type: 'color' },
    ],
  },
  {
    id: 'avatar',
    label: 'Avatar',
    vars: [
      { var: '--pf-avatar-text', label: 'Initials text', type: 'color' },
      { var: '--pf-avatar-status-border', label: 'Status dot border', type: 'color' },
      { var: '--pf-avatar-status-online', label: 'Online status', type: 'color' },
      { var: '--pf-avatar-status-away', label: 'Away status', type: 'color' },
      { var: '--pf-avatar-status-busy', label: 'Busy status', type: 'color' },
      { var: '--pf-avatar-status-offline', label: 'Offline status', type: 'color' },
    ],
  },
  {
    id: 'avatar-group',
    label: 'Avatar Group',
    vars: [
      { var: '--pf-avatar-group-ring', label: 'Ring separator', type: 'color' },
      { var: '--pf-avatar-group-overflow-bg', label: 'Overflow chip BG', type: 'color' },
      { var: '--pf-avatar-group-overflow-text', label: 'Overflow chip text', type: 'color' },
    ],
  },
  {
    id: 'badge',
    label: 'Badge',
    vars: [
      { var: '--pf-badge-neutral-background', label: 'Neutral BG', type: 'color' },
      { var: '--pf-badge-neutral-foreground', label: 'Neutral text', type: 'color' },
      { var: '--pf-badge-brand-background', label: 'Brand BG', type: 'color' },
      { var: '--pf-badge-brand-foreground', label: 'Brand text', type: 'color' },
      { var: '--pf-badge-success-background', label: 'Success BG', type: 'color' },
      { var: '--pf-badge-success-foreground', label: 'Success text', type: 'color' },
      { var: '--pf-badge-warning-background', label: 'Warning BG', type: 'color' },
      { var: '--pf-badge-warning-foreground', label: 'Warning text', type: 'color' },
      { var: '--pf-badge-danger-background', label: 'Danger BG', type: 'color' },
      { var: '--pf-badge-danger-foreground', label: 'Danger text', type: 'color' },
    ],
  },
  {
    id: 'badge-group',
    label: 'Badge Group',
    vars: [
      { var: '--pf-badgegroup-gray-100', label: 'Gray 100', type: 'color' },
      { var: '--pf-badgegroup-gray-200', label: 'Gray 200', type: 'color' },
      { var: '--pf-badgegroup-gray-700', label: 'Gray 700', type: 'color' },
      { var: '--pf-badgegroup-brand-100', label: 'Brand 100', type: 'color' },
      { var: '--pf-badgegroup-brand-300', label: 'Brand 300', type: 'color' },
      { var: '--pf-badgegroup-brand-700', label: 'Brand 700', type: 'color' },
      { var: '--pf-badgegroup-danger-bg', label: 'Danger BG', type: 'color' },
      { var: '--pf-badgegroup-danger-border', label: 'Danger border', type: 'color' },
      { var: '--pf-badgegroup-danger-text', label: 'Danger text', type: 'color' },
      { var: '--pf-badgegroup-warning-bg', label: 'Warning BG', type: 'color' },
      { var: '--pf-badgegroup-warning-border', label: 'Warning border', type: 'color' },
      { var: '--pf-badgegroup-warning-text', label: 'Warning text', type: 'color' },
      { var: '--pf-badgegroup-success-bg', label: 'Success BG', type: 'color' },
      { var: '--pf-badgegroup-success-border', label: 'Success border', type: 'color' },
      { var: '--pf-badgegroup-success-text', label: 'Success text', type: 'color' },
    ],
  },
  {
    id: 'breadcrumbs',
    label: 'Breadcrumbs',
    vars: [
      { var: '--pf-breadcrumbs-link-color', label: 'Link color', type: 'color' },
      { var: '--pf-breadcrumbs-link-hover-color', label: 'Link hover color', type: 'color' },
      { var: '--pf-breadcrumbs-link-current-color', label: 'Current page color', type: 'color' },
      { var: '--pf-breadcrumbs-separator-color', label: 'Separator color', type: 'color' },
    ],
  },
  {
    id: 'button',
    label: 'Button',
    vars: [
      { var: '--pf-button-primary-bg', label: 'Primary BG', type: 'color' },
      { var: '--pf-button-primary-bg-hover', label: 'Primary hover BG', type: 'color' },
      { var: '--pf-button-primary-text', label: 'Primary text', type: 'color' },
      { var: '--pf-button-secondary-bg', label: 'Secondary BG', type: 'color' },
      { var: '--pf-button-secondary-bg-hover', label: 'Secondary hover BG', type: 'color' },
      { var: '--pf-button-secondary-border', label: 'Secondary border', type: 'color' },
      { var: '--pf-button-secondary-border-hover', label: 'Secondary hover border', type: 'color' },
      { var: '--pf-button-secondary-text', label: 'Secondary text', type: 'color' },
      { var: '--pf-button-ghost-text', label: 'Ghost text', type: 'color' },
      { var: '--pf-button-ghost-bg-hover', label: 'Ghost hover BG', type: 'color' },
      { var: '--pf-button-destructive-bg', label: 'Destructive BG', type: 'color' },
      { var: '--pf-button-destructive-bg-hover', label: 'Destructive hover BG', type: 'color' },
      { var: '--pf-button-destructive-text', label: 'Destructive text', type: 'color' },
    ],
  },
  {
    id: 'button-group',
    label: 'Button Group',
    vars: [
      { var: '--pf-buttongroup-bg', label: 'BG', type: 'color' },
      { var: '--pf-buttongroup-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-buttongroup-border', label: 'Border', type: 'color' },
      { var: '--pf-buttongroup-text', label: 'Text', type: 'color' },
      { var: '--pf-buttongroup-action-primary', label: 'Active BG', type: 'color' },
      { var: '--pf-buttongroup-action-primary-hover', label: 'Active hover BG', type: 'color' },
      { var: '--pf-buttongroup-action-primary-text', label: 'Active text', type: 'color' },
      { var: '--pf-buttongroup-dot-selected', label: 'Dot selected', type: 'color' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    vars: [
      { var: '--pf-calendar-bg', label: 'BG', type: 'color' },
      { var: '--pf-calendar-border', label: 'Border', type: 'color' },
      { var: '--pf-calendar-text', label: 'Text', type: 'color' },
      { var: '--pf-calendar-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-calendar-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-calendar-today-bg', label: 'Today BG', type: 'color' },
      { var: '--pf-calendar-today-border', label: 'Today border', type: 'color' },
      { var: '--pf-calendar-selected-bg', label: 'Selected BG', type: 'color' },
      { var: '--pf-calendar-selected-text', label: 'Selected text', type: 'color' },
      { var: '--pf-calendar-selected-bg-hover', label: 'Selected hover BG', type: 'color' },
      { var: '--pf-calendar-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'card',
    label: 'Card',
    vars: [
      { var: '--pf-card-background', label: 'BG', type: 'color' },
      { var: '--pf-card-border', label: 'Border', type: 'color' },
      { var: '--pf-card-footer-gap', label: 'Footer gap', type: 'spacing' },
    ],
  },
  {
    id: 'carousel',
    label: 'Carousel',
    vars: [
      { var: '--pf-carousel-bg', label: 'BG', type: 'color' },
      { var: '--pf-carousel-border', label: 'Border', type: 'color' },
      { var: '--pf-carousel-viewport-bg', label: 'Viewport BG', type: 'color' },
      { var: '--pf-carousel-slide-text', label: 'Slide text', type: 'color' },
      { var: '--pf-carousel-empty-text', label: 'Empty text', type: 'color' },
      { var: '--pf-carousel-nav-text', label: 'Nav text', type: 'color' },
      { var: '--pf-carousel-nav-hover-bg', label: 'Nav hover BG', type: 'color' },
      { var: '--pf-carousel-nav-hover-text', label: 'Nav hover text', type: 'color' },
      { var: '--pf-carousel-indicator-bg', label: 'Indicator BG', type: 'color' },
      { var: '--pf-carousel-indicator-active-bg', label: 'Active indicator BG', type: 'color' },
    ],
  },
  {
    id: 'checkbox',
    label: 'Checkbox',
    vars: [
      { var: '--pf-checkbox-bg', label: 'BG', type: 'color' },
      { var: '--pf-checkbox-border', label: 'Border', type: 'color' },
      { var: '--pf-checkbox-checked-bg', label: 'Checked BG', type: 'color' },
      { var: '--pf-checkbox-check-color', label: 'Checkmark color', type: 'color' },
      { var: '--pf-checkbox-label-text', label: 'Label text', type: 'color' },
    ],
  },
  {
    id: 'code-snippet',
    label: 'Code Snippet',
    vars: [
      { var: '--pf-code-snippet-bg', label: 'BG', type: 'color' },
      { var: '--pf-code-snippet-text', label: 'Text', type: 'color' },
      { var: '--pf-code-snippet-title', label: 'Title', type: 'color' },
      { var: '--pf-code-snippet-language', label: 'Language badge', type: 'color' },
      { var: '--pf-code-snippet-copy-text', label: 'Copy button text', type: 'color' },
      { var: '--pf-code-snippet-line-number', label: 'Line numbers', type: 'color' },
    ],
  },
  {
    id: 'collapsible',
    label: 'Collapsible',
    vars: [
      { var: '--pf-collapsible-border', label: 'Border', type: 'color' },
      { var: '--pf-collapsible-trigger-text', label: 'Trigger text', type: 'color' },
      { var: '--pf-collapsible-trigger-hover-bg', label: 'Trigger hover BG', type: 'color' },
      { var: '--pf-collapsible-icon', label: 'Icon color', type: 'color' },
      { var: '--pf-collapsible-content-text', label: 'Content text', type: 'color' },
    ],
  },
  {
    id: 'combobox',
    label: 'Combobox',
    vars: [
      { var: '--pf-combobox-bg', label: 'BG', type: 'color' },
      { var: '--pf-combobox-border', label: 'Border', type: 'color' },
      { var: '--pf-combobox-text', label: 'Text', type: 'color' },
      { var: '--pf-combobox-placeholder', label: 'Placeholder', type: 'color' },
      { var: '--pf-combobox-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-combobox-invalid-border', label: 'Invalid border', type: 'color' },
      { var: '--pf-combobox-menu-bg', label: 'Menu BG', type: 'color' },
      { var: '--pf-combobox-menu-border', label: 'Menu border', type: 'color' },
      { var: '--pf-combobox-option-active-bg', label: 'Active option BG', type: 'color' },
      { var: '--pf-combobox-option-active-text', label: 'Active option text', type: 'color' },
    ],
  },
  {
    id: 'command-palette',
    label: 'Command Palette',
    vars: [
      { var: '--pf-command-bg', label: 'BG', type: 'color' },
      { var: '--pf-command-border', label: 'Border', type: 'color' },
      { var: '--pf-command-text', label: 'Text', type: 'color' },
      { var: '--pf-command-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-command-shortcut-bg', label: 'Shortcut chip BG', type: 'color' },
      { var: '--pf-command-item-active-bg', label: 'Active item BG', type: 'color' },
      { var: '--pf-command-item-active-text', label: 'Active item text', type: 'color' },
    ],
  },
  {
    id: 'content-divider',
    label: 'Content Divider',
    vars: [
      { var: '--pf-content-divider-text', label: 'Label text', type: 'color' },
      { var: '--pf-content-divider-line', label: 'Line color', type: 'color' },
    ],
  },
  {
    id: 'context-menu',
    label: 'Context Menu',
    vars: [
      { var: '--pf-contextmenu-bg', label: 'BG', type: 'color' },
      { var: '--pf-contextmenu-border', label: 'Border', type: 'color' },
      { var: '--pf-contextmenu-text', label: 'Text', type: 'color' },
      { var: '--pf-contextmenu-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-contextmenu-text-danger', label: 'Danger text', type: 'color' },
      { var: '--pf-contextmenu-separator', label: 'Separator', type: 'color' },
      { var: '--pf-contextmenu-item-active-bg', label: 'Active item BG', type: 'color' },
      { var: '--pf-contextmenu-item-active-text', label: 'Active item text', type: 'color' },
      { var: '--pf-contextmenu-danger-active-bg', label: 'Danger active BG', type: 'color' },
      { var: '--pf-contextmenu-danger-active-text', label: 'Danger active text', type: 'color' },
    ],
  },
  {
    id: 'credit-card',
    label: 'Credit Card',
    vars: [{ var: '--pf-credit-card-text-color', label: 'Text', type: 'color' }],
  },
  {
    id: 'date-picker',
    label: 'Date Picker',
    vars: [
      { var: '--pf-datepicker-bg', label: 'BG', type: 'color' },
      { var: '--pf-datepicker-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-datepicker-border', label: 'Border', type: 'color' },
      { var: '--pf-datepicker-border-strong', label: 'Strong border', type: 'color' },
      { var: '--pf-datepicker-text', label: 'Text', type: 'color' },
      { var: '--pf-datepicker-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-datepicker-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-datepicker-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'date-range-picker',
    label: 'Date Range Picker',
    vars: [
      { var: '--pf-daterange-bg', label: 'BG', type: 'color' },
      { var: '--pf-daterange-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-daterange-border', label: 'Border', type: 'color' },
      { var: '--pf-daterange-border-strong', label: 'Strong border', type: 'color' },
      { var: '--pf-daterange-text', label: 'Text', type: 'color' },
      { var: '--pf-daterange-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-daterange-invalid-border', label: 'Invalid border', type: 'color' },
      { var: '--pf-daterange-menu-bg', label: 'Menu BG', type: 'color' },
      { var: '--pf-daterange-menu-border', label: 'Menu border', type: 'color' },
      { var: '--pf-daterange-range-bg', label: 'Range BG', type: 'color' },
      { var: '--pf-daterange-range-text', label: 'Range text', type: 'color' },
    ],
  },
  {
    id: 'dropdown',
    label: 'Dropdown',
    vars: [
      { var: '--pf-dropdown-text', label: 'Text', type: 'color' },
      { var: '--pf-dropdown-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-dropdown-text-danger', label: 'Danger text', type: 'color' },
    ],
  },
  {
    id: 'empty-state',
    label: 'Empty State',
    vars: [
      { var: '--pf-empty-state-icon', label: 'Icon color', type: 'color' },
      { var: '--pf-empty-state-text', label: 'Heading text', type: 'color' },
      { var: '--pf-empty-state-text-muted', label: 'Description text', type: 'color' },
    ],
  },
  {
    id: 'file-uploader',
    label: 'File Uploader',
    vars: [
      { var: '--pf-file-uploader-bg', label: 'BG', type: 'color' },
      { var: '--pf-file-uploader-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-file-uploader-border', label: 'Border', type: 'color' },
      { var: '--pf-file-uploader-border-strong', label: 'Strong border', type: 'color' },
      { var: '--pf-file-uploader-text', label: 'Text', type: 'color' },
      { var: '--pf-file-uploader-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-file-uploader-active-border', label: 'Drop active border', type: 'color' },
      { var: '--pf-file-uploader-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'gauge-chart',
    label: 'Gauge Chart',
    vars: [
      { var: '--pf-gauge-color', label: 'Fill color', type: 'color' },
      { var: '--pf-gauge-track-color', label: 'Track color', type: 'color' },
      { var: '--pf-gauge-center-bg', label: 'Center BG', type: 'color' },
      { var: '--pf-gauge-label-color', label: 'Label color', type: 'color' },
      { var: '--pf-gauge-sub-label-color', label: 'Sub-label color', type: 'color' },
    ],
  },
  {
    id: 'heatmap',
    label: 'Heatmap',
    vars: [
      { var: '--pf-heatmap-color', label: 'Cell color', type: 'color' },
      { var: '--pf-heatmap-empty', label: 'Empty cell', type: 'color' },
      { var: '--pf-heatmap-label-color', label: 'Label color', type: 'color' },
      { var: '--pf-heatmap-empty-text', label: 'Empty text', type: 'color' },
      { var: '--pf-heatmap-cell-radius', label: 'Cell radius', type: 'spacing' },
    ],
  },
  {
    id: 'header-navigation',
    label: 'Header Navigation',
    vars: [
      { var: '--pf-header-nav-bg', label: 'BG', type: 'color' },
      { var: '--pf-header-nav-border', label: 'Border', type: 'color' },
      { var: '--pf-header-nav-text', label: 'Text', type: 'color' },
      { var: '--pf-header-nav-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-header-nav-bg-subtle', label: 'Subtle BG', type: 'color' },
    ],
  },
  {
    id: 'inline-cta',
    label: 'Inline CTA',
    vars: [
      { var: '--pf-inline-cta-bg', label: 'BG', type: 'color' },
      { var: '--pf-inline-cta-border', label: 'Border', type: 'color' },
      { var: '--pf-inline-cta-text', label: 'Text', type: 'color' },
      { var: '--pf-inline-cta-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-inline-cta-info-bg', label: 'Info BG', type: 'color' },
      { var: '--pf-inline-cta-info-border', label: 'Info border', type: 'color' },
      { var: '--pf-inline-cta-info-icon', label: 'Info icon', type: 'color' },
      { var: '--pf-inline-cta-info-heading', label: 'Info heading', type: 'color' },
      { var: '--pf-inline-cta-success-bg', label: 'Success BG', type: 'color' },
      { var: '--pf-inline-cta-success-border', label: 'Success border', type: 'color' },
      { var: '--pf-inline-cta-warning-bg', label: 'Warning BG', type: 'color' },
      { var: '--pf-inline-cta-warning-border', label: 'Warning border', type: 'color' },
      { var: '--pf-inline-cta-danger-bg', label: 'Danger BG', type: 'color' },
      { var: '--pf-inline-cta-danger-border', label: 'Danger border', type: 'color' },
    ],
  },
  {
    id: 'input',
    label: 'Input',
    vars: [
      { var: '--pf-input-bg', label: 'BG', type: 'color' },
      { var: '--pf-input-border', label: 'Border', type: 'color' },
      { var: '--pf-input-text', label: 'Text', type: 'color' },
      { var: '--pf-input-placeholder', label: 'Placeholder', type: 'color' },
      { var: '--pf-input-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-input-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'kbd',
    label: 'Kbd',
    vars: [
      { var: '--pf-kbd-bg', label: 'BG', type: 'color' },
      { var: '--pf-kbd-border', label: 'Border', type: 'color' },
      { var: '--pf-kbd-text', label: 'Text', type: 'color' },
    ],
  },
  {
    id: 'line-bar-charts',
    label: 'Line / Bar Charts',
    vars: [
      { var: '--pf-chart-color-1', label: 'Series 1', type: 'color' },
      { var: '--pf-chart-color-2', label: 'Series 2', type: 'color' },
      { var: '--pf-chart-color-3', label: 'Series 3', type: 'color' },
      { var: '--pf-chart-color-4', label: 'Series 4', type: 'color' },
      { var: '--pf-chart-color-5', label: 'Series 5', type: 'color' },
      { var: '--pf-chart-color-6', label: 'Series 6', type: 'color' },
      { var: '--pf-chart-grid', label: 'Grid lines', type: 'color' },
      { var: '--pf-chart-text-muted', label: 'Axis labels', type: 'color' },
    ],
  },
  {
    id: 'loading-indicators',
    label: 'Loading Indicators',
    vars: [
      { var: '--pf-loading-border', label: 'Spinner track', type: 'color' },
      { var: '--pf-loading-accent', label: 'Spinner accent', type: 'color' },
      { var: '--pf-loading-bg-subtle', label: 'Skeleton BG', type: 'color' },
    ],
  },
  {
    id: 'metric',
    label: 'Metric',
    vars: [
      { var: '--pf-metric-bg', label: 'BG', type: 'color' },
      { var: '--pf-metric-border', label: 'Border', type: 'color' },
      { var: '--pf-metric-text', label: 'Text', type: 'color' },
      { var: '--pf-metric-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-metric-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-metric-success-bg', label: 'Success trend BG', type: 'color' },
      { var: '--pf-metric-success-text', label: 'Success trend text', type: 'color' },
      { var: '--pf-metric-danger-bg', label: 'Danger trend BG', type: 'color' },
      { var: '--pf-metric-danger-text', label: 'Danger trend text', type: 'color' },
    ],
  },
  {
    id: 'modal',
    label: 'Modal',
    vars: [
      { var: '--pf-modal-bg', label: 'BG', type: 'color' },
      { var: '--pf-modal-border', label: 'Border', type: 'color' },
      { var: '--pf-modal-text', label: 'Text', type: 'color' },
      { var: '--pf-modal-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-modal-bg-subtle', label: 'Subtle BG (header/footer)', type: 'color' },
    ],
  },
  {
    id: 'multi-select',
    label: 'Multi Select',
    vars: [
      { var: '--pf-multiselect-bg', label: 'BG', type: 'color' },
      { var: '--pf-multiselect-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-multiselect-border', label: 'Border', type: 'color' },
      { var: '--pf-multiselect-text', label: 'Text', type: 'color' },
      { var: '--pf-multiselect-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-multiselect-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-multiselect-active-bg', label: 'Active option BG', type: 'color' },
      { var: '--pf-multiselect-active-text', label: 'Active option text', type: 'color' },
      { var: '--pf-multiselect-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'notification',
    label: 'Notification',
    vars: [
      { var: '--pf-notification-bg', label: 'Default BG', type: 'color' },
      { var: '--pf-notification-border', label: 'Default border', type: 'color' },
      { var: '--pf-notification-text', label: 'Text', type: 'color' },
      { var: '--pf-notification-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-notification-info-bg', label: 'Info BG', type: 'color' },
      { var: '--pf-notification-info-border', label: 'Info border', type: 'color' },
      { var: '--pf-notification-info-icon', label: 'Info icon', type: 'color' },
      { var: '--pf-notification-info-title', label: 'Info title', type: 'color' },
      { var: '--pf-notification-success-bg', label: 'Success BG', type: 'color' },
      { var: '--pf-notification-success-border', label: 'Success border', type: 'color' },
      { var: '--pf-notification-success-icon', label: 'Success icon', type: 'color' },
      { var: '--pf-notification-warning-bg', label: 'Warning BG', type: 'color' },
      { var: '--pf-notification-warning-border', label: 'Warning border', type: 'color' },
      { var: '--pf-notification-warning-icon', label: 'Warning icon', type: 'color' },
      { var: '--pf-notification-danger-bg', label: 'Danger BG', type: 'color' },
      { var: '--pf-notification-danger-border', label: 'Danger border', type: 'color' },
      { var: '--pf-notification-danger-icon', label: 'Danger icon', type: 'color' },
    ],
  },
  {
    id: 'number-input',
    label: 'Number Input',
    vars: [
      { var: '--pf-numberinput-bg', label: 'BG', type: 'color' },
      { var: '--pf-numberinput-border', label: 'Border', type: 'color' },
      { var: '--pf-numberinput-text', label: 'Text', type: 'color' },
      { var: '--pf-numberinput-placeholder', label: 'Placeholder', type: 'color' },
      { var: '--pf-numberinput-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-numberinput-invalid-border', label: 'Invalid border', type: 'color' },
      { var: '--pf-numberinput-step-bg', label: 'Step button BG', type: 'color' },
      { var: '--pf-numberinput-step-text', label: 'Step button text', type: 'color' },
      { var: '--pf-numberinput-step-hover-bg', label: 'Step hover BG', type: 'color' },
      { var: '--pf-numberinput-step-hover-text', label: 'Step hover text', type: 'color' },
    ],
  },
  {
    id: 'page-header',
    label: 'Page Header',
    vars: [
      { var: '--pf-page-header-eyebrow', label: 'Eyebrow text', type: 'color' },
      { var: '--pf-page-header-text', label: 'Heading text', type: 'color' },
      { var: '--pf-page-header-text-muted', label: 'Description text', type: 'color' },
    ],
  },
  {
    id: 'pagination',
    label: 'Pagination',
    vars: [
      { var: '--pf-pagination-bg', label: 'BG', type: 'color' },
      { var: '--pf-pagination-border', label: 'Border', type: 'color' },
      { var: '--pf-pagination-text', label: 'Text', type: 'color' },
      { var: '--pf-pagination-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-pagination-active-bg', label: 'Active page BG', type: 'color' },
      { var: '--pf-pagination-active-text', label: 'Active page text', type: 'color' },
      { var: '--pf-pagination-active-hover-bg', label: 'Active hover BG', type: 'color' },
      { var: '--pf-pagination-active-border', label: 'Active border', type: 'color' },
    ],
  },
  {
    id: 'pie-chart',
    label: 'Pie Chart',
    vars: [
      { var: '--pf-piechart-empty', label: 'Empty slice', type: 'color' },
      { var: '--pf-piechart-border-muted', label: 'Slice border', type: 'color' },
      { var: '--pf-piechart-bg', label: 'BG', type: 'color' },
      { var: '--pf-piechart-text', label: 'Text', type: 'color' },
      { var: '--pf-piechart-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'popover',
    label: 'Popover',
    vars: [
      { var: '--pf-popover-bg', label: 'BG', type: 'color' },
      { var: '--pf-popover-border', label: 'Border', type: 'color' },
      { var: '--pf-popover-text', label: 'Text', type: 'color' },
    ],
  },
  {
    id: 'progress-indicators',
    label: 'Progress Indicators',
    vars: [
      { var: '--pf-progress-track-bg', label: 'Track BG', type: 'color' },
      { var: '--pf-progress-accent', label: 'Fill color', type: 'color' },
      { var: '--pf-progress-text', label: 'Text', type: 'color' },
      { var: '--pf-progress-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'progress-steps',
    label: 'Progress Steps',
    vars: [
      { var: '--pf-progress-steps-bg', label: 'BG', type: 'color' },
      { var: '--pf-progress-steps-border', label: 'Border', type: 'color' },
      { var: '--pf-progress-steps-text', label: 'Text', type: 'color' },
      { var: '--pf-progress-steps-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-progress-steps-complete-bg', label: 'Complete step BG', type: 'color' },
      { var: '--pf-progress-steps-complete-border', label: 'Complete step border', type: 'color' },
      { var: '--pf-progress-steps-complete-text', label: 'Complete step text', type: 'color' },
      { var: '--pf-progress-steps-current-bg', label: 'Current step BG', type: 'color' },
      { var: '--pf-progress-steps-current-border', label: 'Current step border', type: 'color' },
      { var: '--pf-progress-steps-current-text', label: 'Current step text', type: 'color' },
      { var: '--pf-progress-steps-current-title', label: 'Current step title', type: 'color' },
    ],
  },
  {
    id: 'radar-chart',
    label: 'Radar Chart',
    vars: [
      { var: '--pf-radar-stroke', label: 'Shape stroke', type: 'color' },
      { var: '--pf-radar-fill', label: 'Shape fill', type: 'color' },
      { var: '--pf-radar-grid-stroke', label: 'Grid stroke', type: 'color' },
      { var: '--pf-radar-axis-stroke', label: 'Axis stroke', type: 'color' },
      { var: '--pf-radar-point-stroke', label: 'Point stroke', type: 'color' },
      { var: '--pf-radar-label', label: 'Axis labels', type: 'color' },
      { var: '--pf-radar-legend-text', label: 'Legend text', type: 'color' },
      { var: '--pf-radar-legend-value', label: 'Legend value', type: 'color' },
    ],
  },
  {
    id: 'radio-button',
    label: 'Radio Button',
    vars: [
      { var: '--pf-radio-checked-color', label: 'Checked color', type: 'color' },
      { var: '--pf-radio-label-text', label: 'Label text', type: 'color' },
    ],
  },
  {
    id: 'radio-group',
    label: 'Radio Group',
    vars: [
      { var: '--pf-radiogroup-text', label: 'Text', type: 'color' },
      { var: '--pf-radiogroup-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-radiogroup-accent', label: 'Selected accent', type: 'color' },
    ],
  },
  {
    id: 'rating',
    label: 'Rating',
    vars: [
      { var: '--pf-rating-text', label: 'Text', type: 'color' },
      { var: '--pf-rating-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-rating-star-empty', label: 'Empty star', type: 'color' },
      { var: '--pf-rating-star-fill', label: 'Filled star', type: 'color' },
      { var: '--pf-rating-badge-bg', label: 'Badge BG', type: 'color' },
      { var: '--pf-rating-badge-border', label: 'Badge border', type: 'color' },
      { var: '--pf-rating-badge-text', label: 'Badge text', type: 'color' },
    ],
  },
  {
    id: 'resizable',
    label: 'Resizable',
    vars: [
      { var: '--pf-resizable-handle-bg', label: 'Handle BG', type: 'color' },
      { var: '--pf-resizable-handle-active-bg', label: 'Handle active BG', type: 'color' },
      { var: '--pf-resizable-grip', label: 'Grip dots', type: 'color' },
    ],
  },
  {
    id: 'rich-text-editor',
    label: 'Rich Text Editor',
    vars: [
      { var: '--pf-rte-bg', label: 'BG', type: 'color' },
      { var: '--pf-rte-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-rte-border', label: 'Border', type: 'color' },
      { var: '--pf-rte-text', label: 'Text', type: 'color' },
      { var: '--pf-rte-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-rte-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-rte-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'scroll-area',
    label: 'Scroll Area',
    vars: [
      { var: '--pf-scrollarea-thumb', label: 'Scrollbar thumb', type: 'color' },
      { var: '--pf-scrollarea-thumb-hover', label: 'Scrollbar thumb hover', type: 'color' },
    ],
  },
  {
    id: 'section-footer',
    label: 'Section Footer',
    vars: [
      { var: '--pf-section-footer-border', label: 'Border', type: 'color' },
      { var: '--pf-section-footer-text', label: 'Text', type: 'color' },
      { var: '--pf-section-footer-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'section-header',
    label: 'Section Header',
    vars: [
      { var: '--pf-section-header-border', label: 'Border', type: 'color' },
      { var: '--pf-section-header-text', label: 'Text', type: 'color' },
      { var: '--pf-section-header-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'select',
    label: 'Select',
    vars: [
      { var: '--pf-select-menu-bg', label: 'Menu BG', type: 'color' },
      { var: '--pf-select-menu-border', label: 'Menu border', type: 'color' },
      { var: '--pf-select-option-active-bg', label: 'Active option BG', type: 'color' },
      { var: '--pf-select-option-active-text', label: 'Active option text', type: 'color' },
      { var: '--pf-select-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-select-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'sidebar-navigation',
    label: 'Sidebar Navigation',
    vars: [
      { var: '--pf-sidebar-nav-bg', label: 'BG', type: 'color' },
      { var: '--pf-sidebar-nav-border', label: 'Border', type: 'color' },
      { var: '--pf-sidebar-nav-text', label: 'Text', type: 'color' },
      { var: '--pf-sidebar-nav-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-sidebar-nav-bg-subtle', label: 'Subtle BG (hover)', type: 'color' },
    ],
  },
  {
    id: 'slideout-menu',
    label: 'Slideout Menu',
    vars: [
      { var: '--pf-slideout-bg', label: 'BG', type: 'color' },
      { var: '--pf-slideout-border', label: 'Border', type: 'color' },
      { var: '--pf-slideout-text', label: 'Text', type: 'color' },
      { var: '--pf-slideout-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-slideout-bg-subtle', label: 'Subtle BG', type: 'color' },
    ],
  },
  {
    id: 'slider',
    label: 'Slider',
    vars: [
      { var: '--pf-slider-text', label: 'Text', type: 'color' },
      { var: '--pf-slider-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-slider-error-text', label: 'Error text', type: 'color' },
      { var: '--pf-slider-action', label: 'Track fill / thumb', type: 'color' },
      { var: '--pf-slider-border', label: 'Track border', type: 'color' },
      { var: '--pf-slider-bg', label: 'Track BG', type: 'color' },
      { var: '--pf-slider-danger-fill', label: 'Danger fill', type: 'color' },
    ],
  },
  {
    id: 'sparkline',
    label: 'Sparkline',
    vars: [{ var: '--pf-sparkline-color', label: 'Line color', type: 'color' }],
  },
  {
    id: 'surface',
    label: 'Surface',
    vars: [
      { var: '--pf-surface-bg', label: 'Raised surface BG', type: 'color' },
      { var: '--pf-surface-subtle', label: 'Subtle surface BG', type: 'color' },
      { var: '--pf-surface-border', label: 'Surface border', type: 'color' },
      { var: '--pf-surface-border-strong', label: 'Strong surface border', type: 'color' },
    ],
  },
  {
    id: 'switch',
    label: 'Switch',
    vars: [
      { var: '--pf-switch-track-bg', label: 'Track BG (off)', type: 'color' },
      { var: '--pf-switch-thumb-bg', label: 'Thumb BG', type: 'color' },
      { var: '--pf-switch-track-checked-bg', label: 'Track BG (on)', type: 'color' },
      { var: '--pf-switch-label-text', label: 'Label text', type: 'color' },
    ],
  },
  {
    id: 'table',
    label: 'Table',
    vars: [
      { var: '--pf-table-bg', label: 'BG', type: 'color' },
      { var: '--pf-table-bg-subtle', label: 'Striped row BG', type: 'color' },
      { var: '--pf-table-border', label: 'Border', type: 'color' },
      { var: '--pf-table-text', label: 'Text', type: 'color' },
      { var: '--pf-table-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'tabs',
    label: 'Tabs',
    vars: [
      { var: '--pf-tabs-border', label: 'Border', type: 'color' },
      { var: '--pf-tabs-bg-subtle', label: 'Subtle BG', type: 'color' },
      { var: '--pf-tabs-bg', label: 'BG', type: 'color' },
      { var: '--pf-tabs-text', label: 'Text', type: 'color' },
      { var: '--pf-tabs-text-muted', label: 'Muted text', type: 'color' },
    ],
  },
  {
    id: 'tag',
    label: 'Tag',
    vars: [
      { var: '--pf-tag-neutral-bg', label: 'Neutral BG', type: 'color' },
      { var: '--pf-tag-neutral-text', label: 'Neutral text', type: 'color' },
      { var: '--pf-tag-brand-bg', label: 'Brand BG', type: 'color' },
      { var: '--pf-tag-brand-text', label: 'Brand text', type: 'color' },
      { var: '--pf-tag-success-bg', label: 'Success BG', type: 'color' },
      { var: '--pf-tag-success-text', label: 'Success text', type: 'color' },
      { var: '--pf-tag-warning-bg', label: 'Warning BG', type: 'color' },
      { var: '--pf-tag-warning-text', label: 'Warning text', type: 'color' },
      { var: '--pf-tag-danger-bg', label: 'Danger BG', type: 'color' },
      { var: '--pf-tag-danger-text', label: 'Danger text', type: 'color' },
    ],
  },
  {
    id: 'tag-input',
    label: 'Tag Input',
    vars: [
      { var: '--pf-taginput-bg', label: 'BG', type: 'color' },
      { var: '--pf-taginput-border', label: 'Border', type: 'color' },
      { var: '--pf-taginput-text', label: 'Text', type: 'color' },
      { var: '--pf-taginput-placeholder', label: 'Placeholder', type: 'color' },
      { var: '--pf-taginput-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-taginput-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'textarea',
    label: 'Textarea',
    vars: [
      { var: '--pf-textarea-bg', label: 'BG', type: 'color' },
      { var: '--pf-textarea-border', label: 'Border', type: 'color' },
      { var: '--pf-textarea-text', label: 'Text', type: 'color' },
      { var: '--pf-textarea-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-textarea-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-textarea-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
  {
    id: 'time-picker',
    label: 'Time Picker',
    vars: [
      { var: '--pf-timepicker-bg', label: 'BG', type: 'color' },
      { var: '--pf-timepicker-border', label: 'Border', type: 'color' },
      { var: '--pf-timepicker-text', label: 'Text', type: 'color' },
      { var: '--pf-timepicker-placeholder', label: 'Placeholder', type: 'color' },
      { var: '--pf-timepicker-focus-border', label: 'Focus border', type: 'color' },
      { var: '--pf-timepicker-invalid-border', label: 'Invalid border', type: 'color' },
      { var: '--pf-timepicker-menu-bg', label: 'Menu BG', type: 'color' },
      { var: '--pf-timepicker-menu-border', label: 'Menu border', type: 'color' },
      { var: '--pf-timepicker-option-active-bg', label: 'Active option BG', type: 'color' },
      { var: '--pf-timepicker-option-active-text', label: 'Active option text', type: 'color' },
    ],
  },
  {
    id: 'timeline',
    label: 'Timeline',
    vars: [
      { var: '--pf-timeline-connector', label: 'Connector line', type: 'color' },
      { var: '--pf-timeline-title', label: 'Title text', type: 'color' },
      { var: '--pf-timeline-timestamp', label: 'Timestamp text', type: 'color' },
      { var: '--pf-timeline-description', label: 'Description text', type: 'color' },
      { var: '--pf-timeline-default-bg', label: 'Default marker BG', type: 'color' },
      { var: '--pf-timeline-default-border', label: 'Default marker border', type: 'color' },
      { var: '--pf-timeline-default-icon', label: 'Default icon', type: 'color' },
      { var: '--pf-timeline-success-bg', label: 'Success marker BG', type: 'color' },
      { var: '--pf-timeline-success-border', label: 'Success marker border', type: 'color' },
      { var: '--pf-timeline-warning-bg', label: 'Warning marker BG', type: 'color' },
      { var: '--pf-timeline-warning-border', label: 'Warning marker border', type: 'color' },
      { var: '--pf-timeline-danger-bg', label: 'Danger marker BG', type: 'color' },
      { var: '--pf-timeline-danger-border', label: 'Danger marker border', type: 'color' },
    ],
  },
  {
    id: 'toolbar',
    label: 'Toolbar',
    vars: [
      { var: '--pf-toolbar-bg', label: 'BG', type: 'color' },
      { var: '--pf-toolbar-border', label: 'Border', type: 'color' },
      { var: '--pf-toolbar-separator', label: 'Separator', type: 'color' },
    ],
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    vars: [
      { var: '--pf-tooltip-bg', label: 'BG', type: 'color' },
      { var: '--pf-tooltip-text', label: 'Text', type: 'color' },
      { var: '--pf-tooltip-padding-x', label: 'Horizontal padding', type: 'spacing' },
    ],
  },
  {
    id: 'tree-view',
    label: 'Tree View',
    vars: [
      { var: '--pf-treeview-bg', label: 'BG', type: 'color' },
      { var: '--pf-treeview-border', label: 'Border', type: 'color' },
      { var: '--pf-treeview-text', label: 'Text', type: 'color' },
      { var: '--pf-treeview-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-treeview-bg-subtle', label: 'Hover BG', type: 'color' },
    ],
  },
  {
    id: 'utility-button',
    label: 'Utility Button',
    vars: [
      { var: '--pf-utility-btn-neutral-bg', label: 'Neutral BG', type: 'color' },
      { var: '--pf-utility-btn-neutral-border', label: 'Neutral border', type: 'color' },
      { var: '--pf-utility-btn-neutral-text', label: 'Neutral text', type: 'color' },
      { var: '--pf-utility-btn-neutral-bg-hover', label: 'Neutral hover BG', type: 'color' },
      {
        var: '--pf-utility-btn-neutral-border-hover',
        label: 'Neutral hover border',
        type: 'color',
      },
      { var: '--pf-utility-btn-brand-bg', label: 'Brand BG', type: 'color' },
      { var: '--pf-utility-btn-brand-border', label: 'Brand border', type: 'color' },
      { var: '--pf-utility-btn-brand-text', label: 'Brand text', type: 'color' },
      { var: '--pf-utility-btn-brand-bg-hover', label: 'Brand hover BG', type: 'color' },
      { var: '--pf-utility-btn-destructive-bg', label: 'Destructive BG', type: 'color' },
      { var: '--pf-utility-btn-destructive-border', label: 'Destructive border', type: 'color' },
      { var: '--pf-utility-btn-destructive-text', label: 'Destructive text', type: 'color' },
      {
        var: '--pf-utility-btn-destructive-bg-hover',
        label: 'Destructive hover BG',
        type: 'color',
      },
    ],
  },
  {
    id: 'video-player',
    label: 'Video Player',
    vars: [
      { var: '--pf-videoplayer-bg', label: 'BG', type: 'color' },
      { var: '--pf-videoplayer-border', label: 'Border', type: 'color' },
      { var: '--pf-videoplayer-text-muted', label: 'Muted text', type: 'color' },
      { var: '--pf-videoplayer-invalid-border', label: 'Invalid border', type: 'color' },
    ],
  },
];

// ── Color resolution ──────────────────────────────────────────────────────────

function resolveColorVarToHex(varName: string): string {
  try {
    const el = document.createElement('div');
    document.body.appendChild(el);
    el.style.setProperty('color', `var(${varName})`);
    const rgb = getComputedStyle(el).color;
    document.body.removeChild(el);
    const m = rgb.match(/\d+/g);
    if (m && m.length >= 3) {
      return (
        '#' + [m[0], m[1], m[2]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('')
      );
    }
  } catch {
    // ignore
  }
  return '#808080';
}

// ── Var controls ─────────────────────────────────────────────────────────────

interface VarControlProps {
  def: VarDef;
  theme: ThemeState;
  resetKey: number;
  onReset: (varName: string) => void;
}

function ColorVarControl({ def, theme, resetKey, onReset }: VarControlProps) {
  const [initialHex] = useState<string>(() => {
    const override = theme.overrides[def.var];
    if (override && /^#[0-9a-f]{6}/i.test(override)) return override;
    return resolveColorVarToHex(def.var);
  });
  const isModified = theme.isModified(def.var);

  return (
    <div className={`comp-var-row ${isModified ? 'comp-var-row--modified' : ''}`}>
      <div className="comp-var-color">
        <div className="comp-var-live-swatch" style={{ background: `var(${def.var})` }} />
        <input
          key={`${def.var}-${resetKey}`}
          type="color"
          defaultValue={initialHex}
          onChange={(e) => theme.set(def.var, e.target.value)}
          className="comp-var-picker"
          aria-label={`${def.label} color`}
        />
      </div>
      <div className="comp-var-info">
        <span className="comp-var-label">{def.label}</span>
        <code className="comp-var-code">{def.var}</code>
      </div>
      {isModified && (
        <UtilityButton size="sm" onClick={() => onReset(def.var)} aria-label={`Reset ${def.label}`}>
          ↺
        </UtilityButton>
      )}
    </div>
  );
}

function SizeVarControl({ def, theme, onReset }: VarControlProps) {
  const value = theme.getValue(def.var);
  const isModified = theme.isModified(def.var);

  return (
    <div className={`comp-var-row ${isModified ? 'comp-var-row--modified' : ''}`}>
      <div className="comp-var-size-chip">
        <code className="comp-var-size-value">{value || '—'}</code>
      </div>
      <div className="comp-var-info">
        <span className="comp-var-label">{def.label}</span>
        <code className="comp-var-code">{def.var}</code>
      </div>
      {isModified && (
        <UtilityButton size="sm" onClick={() => onReset(def.var)} aria-label={`Reset ${def.label}`}>
          ↺
        </UtilityButton>
      )}
    </div>
  );
}

// ── Previews ──────────────────────────────────────────────────────────────────

const ACCORDION_ITEMS = [
  {
    value: 'a',
    title: 'What is a design token?',
    content:
      'Design tokens store UI decisions as named variables. Colors, spacing, and typography all become tokens that can be swapped at the theme level.',
  },
  {
    value: 'b',
    title: 'How do overrides work?',
    content:
      'Overriding a --pf-* variable on :root detaches it from the global token cascade. The component picks up the override while the rest of the theme stays intact.',
  },
];

function AccordionPreview() {
  const [value, setValue] = useState<string[]>(['a']);
  return <Accordion items={ACCORDION_ITEMS} type="single" value={value} onValueChange={setValue} />;
}

function AlertPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Alert variant="info" heading="Information" description="Your settings have been saved." />
      <Alert variant="success" heading="Success" description="The action completed successfully." />
      <Alert variant="warning" heading="Warning" description="This action cannot be undone." />
      <Alert
        variant="danger"
        heading="Error"
        description="Something went wrong. Please try again."
      />
    </div>
  );
}

function AvatarPreview() {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar name="Alice Johnson" status="online" size="sm" />
      <Avatar name="Bob Smith" status="away" size="md" />
      <Avatar name="Charlie D" status="busy" size="lg" />
      <Avatar name="Dana White" status="offline" size="xl" />
    </div>
  );
}

function AvatarGroupPreview() {
  return (
    <AvatarGroup
      avatars={[
        { name: 'Alice J.' },
        { name: 'Bob S.' },
        { name: 'Charlie D.' },
        { name: 'Dana W.' },
        { name: 'Eve R.' },
      ]}
      max={3}
    />
  );
}

function BadgePreview() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
    </div>
  );
}

function BadgeGroupPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <BadgeGroup label="New" message="Pitchfork UI v2.0 is out" color="brand" />
      <BadgeGroup
        label="3 errors"
        message="Build failed on main"
        color="error"
        appearance="modern"
      />
      <BadgeGroup
        label="Done"
        message="Deploy completed"
        color="success"
        appearance="modern"
        badgePosition="trailing"
      />
    </div>
  );
}

function BreadcrumbsPreview() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '#' },
        { label: 'Settings', href: '#' },
        { label: 'Theme', current: true },
      ]}
    />
  );
}

function ButtonPreview() {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  );
}

function ButtonGroupPreview() {
  const [selected, setSelected] = useState<string | string[]>('list');
  return (
    <ButtonGroup
      value={selected}
      onValueChange={setSelected}
      items={[
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grid' },
        { value: 'table', label: 'Table' },
      ]}
    />
  );
}

function CardPreview() {
  return (
    <Card>
      <CardHeader>
        <strong>Design tokens</strong>
        <Badge variant="brand">v2</Badge>
      </CardHeader>
      <CardContent>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: 'var(--color-semantic-text-muted)',
            lineHeight: 1.6,
          }}
        >
          Cards use <code>--pf-card-background</code> and <code>--pf-card-border</code> for their
          surface. Override them here to detach this component from the global theme.
        </p>
      </CardContent>
    </Card>
  );
}

function CheckboxPreview() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [c, setC] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Checkbox label="Enable dark mode" checked={a} onChange={(e) => setA(e.target.checked)} />
      <Checkbox label="Auto-save drafts" checked={b} onChange={(e) => setB(e.target.checked)} />
      <Checkbox
        label="Send email notifications"
        checked={c}
        onChange={(e) => setC(e.target.checked)}
      />
    </div>
  );
}

function CodeSnippetPreview() {
  return (
    <CodeSnippet
      language="css"
      title="theme-override.css"
      code={`:root {\n  --pf-button-primary-bg: #7c3aed;\n  --pf-button-primary-bg-hover: #6d28d9;\n}`}
    />
  );
}

function CollapsiblePreview() {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible trigger="Show advanced options" open={open} onOpenChange={setOpen}>
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Input label="Custom CSS class" placeholder="my-custom-class" />
        <Switch label="Enable reduced motion" />
      </div>
    </Collapsible>
  );
}

function ContentDividerPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ContentDivider />
      <ContentDivider label="or" />
      <ContentDivider label="continue with" />
    </div>
  );
}

const DROPDOWN_ITEMS = [
  { label: 'Duplicate', value: 'duplicate' },
  { label: 'Rename', value: 'rename' },
  { label: 'Export', value: 'export' },
  { label: 'Delete', value: 'delete', destructive: true },
];

function DropdownPreview() {
  return <Dropdown label="Actions" items={DROPDOWN_ITEMS} />;
}

function EmptyStatePreview() {
  return (
    <EmptyState
      iconName="folder-open"
      heading="No components overridden"
      description="Select a component from the sidebar and adjust its CSS variables to see overrides appear here."
      size="sm"
    />
  );
}

function InputPreview() {
  const [v, setV] = useState('');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Email address"
        placeholder="you@example.com"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <Input label="Password" type="password" placeholder="••••••••" />
      <Input label="Invalid field" placeholder="Bad input" error="This field has an error." />
    </div>
  );
}

function KbdPreview() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <Kbd>⌘</Kbd>
      <span style={{ fontSize: 13, color: 'var(--color-semantic-text-muted)' }}>+</span>
      <Kbd>K</Kbd>
      <span style={{ fontSize: 13, color: 'var(--color-semantic-text-muted)', margin: '0 8px' }}>
        or
      </span>
      <Kbd>Ctrl</Kbd>
      <span style={{ fontSize: 13, color: 'var(--color-semantic-text-muted)' }}>+</span>
      <Kbd>Shift</Kbd>
      <span style={{ fontSize: 13, color: 'var(--color-semantic-text-muted)' }}>+</span>
      <Kbd>P</Kbd>
    </div>
  );
}

function LoadingIndicatorsPreview() {
  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <LoadingSpinner size={32} />
        <span style={{ fontSize: 11, color: 'var(--color-semantic-text-muted)' }}>Spinner</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <LoadingDots />
        <span style={{ fontSize: 11, color: 'var(--color-semantic-text-muted)' }}>Dots</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ProgressBar value={65} label="Upload progress" />
        <ProgressBar value={30} label="Processing" />
      </div>
    </div>
  );
}

function MetricPreview() {
  return (
    <MetricGrid>
      <MetricCard
        heading="Total revenue"
        value="$48,295"
        description="Last 30 days"
        trend="positive"
        trendLabel="+12.4%"
      />
      <MetricCard
        heading="Active users"
        value="3,841"
        description="vs. 3,210 last month"
        trend="positive"
        trendLabel="+19.7%"
      />
    </MetricGrid>
  );
}

function NotificationPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Notification
        variant="info"
        heading="Update available"
        description="Version 2.4.0 is ready to install."
      />
      <Notification
        variant="success"
        heading="Published"
        description="Your changes are live."
        dismissible
      />
      <Notification
        variant="warning"
        heading="Approaching limit"
        description="You've used 80% of your storage."
      />
      <Notification
        variant="danger"
        heading="Build failed"
        description="3 errors found. See the logs for details."
        dismissible
      />
    </div>
  );
}

function NumberInputPreview() {
  const [v, setV] = useState<number | null>(42);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <NumberInput label="Quantity" value={v} onValueChange={setV} min={0} max={100} />
      <NumberInput label="Price" value={0} min={0} step={0.01} />
    </div>
  );
}

function PageHeaderPreview() {
  return (
    <PageHeader
      eyebrow="Design system"
      heading="Theme Builder"
      description="Customize CSS variables to match your brand. Export your overrides as a single :root block."
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" size="sm">
            Reset
          </Button>
          <Button size="sm">Export CSS</Button>
        </div>
      }
    />
  );
}

function PaginationPreview() {
  const [page, setPage] = useState(3);
  return <Pagination page={page} totalPages={12} onPageChange={setPage} />;
}

function ProgressIndicatorsPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ProgressBar value={75} label="Project completion" showValue />
      <ProgressBar value={40} label="Upload" showValue />
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <ProgressCircle value={75} size={64} showValue label="Progress" />
        <ProgressCircle value={40} size={48} showValue={false} label="Progress" />
      </div>
    </div>
  );
}

const PROGRESS_STEPS = [
  { title: 'Account created', status: 'complete' as const },
  { title: 'Email verified', status: 'complete' as const },
  { title: 'Profile setup', status: 'current' as const, description: 'Add your name and photo' },
  { title: 'First project', status: 'upcoming' as const },
];

function ProgressStepsPreview() {
  return <ProgressSteps steps={PROGRESS_STEPS} orientation="vertical" />;
}

function RadioButtonPreview() {
  const [v, setV] = useState('light');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { value: 'light', label: 'Light theme' },
        { value: 'dark', label: 'Dark theme' },
        { value: 'system', label: 'System preference' },
      ].map((opt) => (
        <RadioButton
          key={opt.value}
          value={opt.value}
          label={opt.label}
          name="theme-mode"
          checked={v === opt.value}
          onChange={(e) => setV(e.target.value)}
        />
      ))}
    </div>
  );
}

function RadioGroupPreview() {
  const [v, setV] = useState('md');
  return (
    <RadioGroup
      legend="Component size"
      value={v}
      onValueChange={setV}
      options={[
        { value: 'sm', label: 'Small', description: 'Compact layout' },
        { value: 'md', label: 'Medium', description: 'Default size' },
        { value: 'lg', label: 'Large', description: 'More padding' },
      ]}
    />
  );
}

function RatingPreview() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <RatingBadge value={4.3} reviews={284} />
      <RatingStars value={4.3} showValue />
      <RatingStars value={3} max={5} size={24} />
    </div>
  );
}

function SelectPreview() {
  const [v, setV] = useState('');
  return (
    <Select
      label="Font family"
      placeholder="Choose a typeface…"
      value={v}
      onValueChange={setV}
      options={[
        { value: 'inter', label: 'Inter' },
        { value: 'geist', label: 'Geist' },
        { value: 'roboto', label: 'Roboto' },
        { value: 'system', label: 'System UI' },
      ]}
    />
  );
}

function SectionHeaderPreview() {
  return (
    <SectionHeader
      eyebrow="Components"
      heading="Button"
      description="Primary action trigger for forms, dialogs, and toolbars."
      divider
      actions={
        <Button size="sm" variant="secondary">
          View in Storybook
        </Button>
      }
    />
  );
}

function SectionFooterPreview() {
  return (
    <SectionFooter>
      <span style={{ fontSize: 13, color: 'var(--color-semantic-text-muted)' }}>
        Last updated 3 minutes ago
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button size="sm" variant="secondary">
          Cancel
        </Button>
        <Button size="sm">Save changes</Button>
      </div>
    </SectionFooter>
  );
}

function SliderPreview() {
  const [opacity, setOpacity] = useState(80);
  const [blur, setBlur] = useState(12);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Slider
        label="Opacity"
        min={0}
        max={100}
        value={opacity}
        onValueChange={setOpacity}
        showValue
      />
      <Slider label="Blur radius" min={0} max={40} value={blur} onValueChange={setBlur} showValue />
    </div>
  );
}

function SwitchPreview() {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [c, setC] = useState(true);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Switch label="Enable notifications" checked={a} onChange={(e) => setA(e.target.checked)} />
      <Switch label="Auto-save drafts" checked={b} onChange={(e) => setB(e.target.checked)} />
      <Switch label="Compact view" checked={c} onChange={(e) => setC(e.target.checked)} />
    </div>
  );
}

const TABLE_COLUMNS = [
  { key: 'name', header: 'Component', width: '40%' },
  { key: 'vars', header: 'CSS Variables', width: '20%' },
  { key: 'status', header: 'Status', width: '20%' },
  { key: 'modified', header: 'Modified', width: '20%' },
];

const TABLE_ROWS = [
  { name: 'Button', vars: '13', status: <Badge variant="success">Stable</Badge>, modified: 'Yes' },
  { name: 'Badge', vars: '10', status: <Badge variant="success">Stable</Badge>, modified: 'No' },
  { name: 'Input', vars: '6', status: <Badge variant="success">Stable</Badge>, modified: 'No' },
  { name: 'Card', vars: '3', status: <Badge variant="brand">New</Badge>, modified: 'Yes' },
];

function TablePreview() {
  return <Table columns={TABLE_COLUMNS} rows={TABLE_ROWS} />;
}

function TabsPreview() {
  return (
    <Tabs
      defaultValue="overview"
      items={[
        {
          value: 'overview',
          label: 'Overview',
          content: (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 14,
                color: 'var(--color-semantic-text-muted)',
              }}
            >
              Overview content goes here.
            </p>
          ),
        },
        {
          value: 'tokens',
          label: 'Tokens',
          content: (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 14,
                color: 'var(--color-semantic-text-muted)',
              }}
            >
              Token documentation here.
            </p>
          ),
        },
        {
          value: 'examples',
          label: 'Examples',
          content: (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 14,
                color: 'var(--color-semantic-text-muted)',
              }}
            >
              Usage examples here.
            </p>
          ),
        },
      ]}
    />
  );
}

function TagPreview() {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Tag variant="neutral">Neutral</Tag>
      <Tag variant="brand">Brand</Tag>
      <Tag variant="success">Success</Tag>
      <Tag variant="warning">Warning</Tag>
      <Tag variant="danger">Danger</Tag>
    </div>
  );
}

function TextareaPreview() {
  const [v, setV] = useState('');
  return (
    <Textarea
      label="Component notes"
      placeholder="Add any notes about this component's customizations…"
      value={v}
      onChange={(e) => setV(e.target.value)}
      rows={4}
    />
  );
}

const TIMELINE_ITEMS = [
  { id: '1', title: 'Project created', timestamp: '9:00 AM', tone: 'default' as const },
  {
    id: '2',
    title: 'First token defined',
    description: '--color-brand-600 set to indigo',
    timestamp: '9:15 AM',
    tone: 'success' as const,
  },
  {
    id: '3',
    title: 'Design review',
    description: 'Stakeholder feedback collected',
    timestamp: '11:30 AM',
    tone: 'warning' as const,
  },
  {
    id: '4',
    title: 'Build failed',
    description: 'Missing peer dependency',
    timestamp: '2:00 PM',
    tone: 'danger' as const,
  },
];

function TimelinePreview() {
  return <Timeline items={TIMELINE_ITEMS} />;
}

function TooltipPreview() {
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
      <Tooltip content="Top tooltip" placement="top">
        <Button variant="secondary" size="sm">
          Hover top
        </Button>
      </Tooltip>
      <Tooltip content="Right tooltip" placement="right">
        <Button variant="secondary" size="sm">
          Hover right
        </Button>
      </Tooltip>
      <Tooltip content="Bottom tooltip" placement="bottom">
        <Button variant="secondary" size="sm">
          Hover bottom
        </Button>
      </Tooltip>
    </div>
  );
}

const TREE_NODES = [
  {
    value: 'components',
    label: 'components',
    children: [
      { value: 'button', label: 'Button' },
      { value: 'badge', label: 'Badge' },
      {
        value: 'form',
        label: 'form',
        children: [
          { value: 'input', label: 'Input' },
          { value: 'select', label: 'Select' },
          { value: 'checkbox', label: 'Checkbox' },
        ],
      },
    ],
  },
  { value: 'hooks', label: 'hooks' },
  { value: 'styles', label: 'styles' },
];

function TreeViewPreview() {
  return <TreeView nodes={TREE_NODES} defaultExpandedValues={['components', 'form']} />;
}

function UtilityButtonPreview() {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <UtilityButton variant="neutral">Neutral</UtilityButton>
      <UtilityButton variant="brand">Brand</UtilityButton>
      <UtilityButton variant="destructive">Destructive</UtilityButton>
      <UtilityButton
        variant="neutral"
        icon={<Icon name="ellipsis" aria-hidden />}
        aria-label="More options"
      />
      <UtilityButton
        variant="brand"
        icon={<Icon name="star" aria-hidden />}
        aria-label="Favorite"
      />
    </div>
  );
}

// ── Preview registry ──────────────────────────────────────────────────────────

type PreviewFn = () => ReactElement;

const PREVIEWS: Record<string, PreviewFn> = {
  accordion: AccordionPreview,
  alert: AlertPreview,
  avatar: AvatarPreview,
  'avatar-group': AvatarGroupPreview,
  badge: BadgePreview,
  'badge-group': BadgeGroupPreview,
  breadcrumbs: BreadcrumbsPreview,
  button: ButtonPreview,
  'button-group': ButtonGroupPreview,
  card: CardPreview,
  checkbox: CheckboxPreview,
  'code-snippet': CodeSnippetPreview,
  collapsible: CollapsiblePreview,
  'content-divider': ContentDividerPreview,
  dropdown: DropdownPreview,
  'empty-state': EmptyStatePreview,
  input: InputPreview,
  kbd: KbdPreview,
  'loading-indicators': LoadingIndicatorsPreview,
  metric: MetricPreview,
  notification: NotificationPreview,
  'number-input': NumberInputPreview,
  'page-header': PageHeaderPreview,
  pagination: PaginationPreview,
  'progress-indicators': ProgressIndicatorsPreview,
  'progress-steps': ProgressStepsPreview,
  'radio-button': RadioButtonPreview,
  'radio-group': RadioGroupPreview,
  rating: RatingPreview,
  select: SelectPreview,
  'section-footer': SectionFooterPreview,
  'section-header': SectionHeaderPreview,
  slider: SliderPreview,
  switch: SwitchPreview,
  table: TablePreview,
  tabs: TabsPreview,
  tag: TagPreview,
  textarea: TextareaPreview,
  timeline: TimelinePreview,
  tooltip: TooltipPreview,
  'tree-view': TreeViewPreview,
  'utility-button': UtilityButtonPreview,
};

// ── Intro screen ─────────────────────────────────────────────────────────────

function ComponentsIntro({
  totalOverrides,
  componentCount,
}: {
  totalOverrides: number;
  componentCount: number;
}) {
  const totalVars = MANIFEST.reduce((sum, c) => sum + c.vars.length, 0);

  return (
    <div className="comp-intro">
      <Card>
        <CardHeader>
          <span className="comp-canvas__section-label">Component overrides</span>
        </CardHeader>

        <CardContent>
          <p className="comp-intro__description">
            Every component in Pitchfork UI exposes its own set of <code>--pf-*</code> CSS custom
            properties — a layer between the component's styles and the global design tokens.
            Overriding them here lets you fine-tune a single component without touching any of your
            theme-level colors, spacing, or shadows.
          </p>

          <div className="comp-intro__stats">
            <div className="comp-intro__stat">
              <span className="comp-intro__stat-value">{componentCount}</span>
              <span className="comp-intro__stat-label">components</span>
            </div>
            <div className="comp-intro__stat">
              <span className="comp-intro__stat-value">{totalVars}</span>
              <span className="comp-intro__stat-label">CSS variables</span>
            </div>
            <div className="comp-intro__stat">
              <span
                className={`comp-intro__stat-value ${totalOverrides > 0 ? 'comp-intro__stat-value--active' : ''}`}
              >
                {totalOverrides}
              </span>
              <span className="comp-intro__stat-label">overridden</span>
            </div>
          </div>

          <div className="comp-intro__how">
            <p className="comp-intro__how-heading">How it works</p>
            <ol className="comp-intro__steps">
              <li>
                <strong>Pick a component</strong> from the list on the left. Use the search field to
                jump straight to it.
              </li>
              <li>
                <strong>Click any color swatch</strong> to open a color picker and set a concrete
                hex value. The live swatch always reflects the browser-resolved color — even before
                you've overridden anything.
              </li>
              <li>
                <strong>Watch the preview</strong> update in real time. Overridden rows turn blue so
                you can see exactly what's changed at a glance.
              </li>
              <li>
                <strong>Reset a single variable</strong> with ↺, or use "Reset all" to restore the
                entire component to its theme defaults.
              </li>
              <li>
                <strong>Export</strong> from the toolbar above — overridden <code>--pf-*</code> vars
                are included alongside any color, shadow, or size changes made elsewhere in the
                builder.
              </li>
            </ol>
          </div>
        </CardContent>

        <CardFooter>
          <p className="comp-intro__tip">
            <strong>Tip:</strong> Component overrides cascade on top of global token changes.
            Setting <code>--pf-button-primary-bg</code> here will take precedence over whatever{' '}
            <code>--color-semantic-action-primary</code> resolves to everywhere else.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

interface ComponentsViewProps {
  theme: ThemeState;
}

export function ComponentsView({ theme }: ComponentsViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = MANIFEST.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));

  const selected = selectedId ? (MANIFEST.find((c) => c.id === selectedId) ?? null) : null;
  const totalOverrides = MANIFEST.reduce(
    (sum, c) => sum + c.vars.filter((v) => theme.isModified(v.var)).length,
    0,
  );

  return (
    <div className="view-layout">
      <div className="view-layout__editor components-sidebar">
        <div className="components-search">
          <Input
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search components"
          />
        </div>
        <div className="components-list" role="listbox" aria-label="Components">
          {filtered.length === 0 && (
            <p className="components-list__empty">No components match "{search}"</p>
          )}
          {filtered.map((c) => {
            const overrideCount = c.vars.filter((v) => theme.isModified(v.var)).length;
            const isSelected = selectedId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`component-item ${isSelected ? 'component-item--active' : ''}`}
                onClick={() => setSelectedId(c.id)}
              >
                <span className="component-item__label">{c.label}</span>
                {overrideCount > 0 && (
                  <span
                    className="component-item__count"
                    aria-label={`${overrideCount} overridden`}
                  >
                    {overrideCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="view-layout__canvas">
        {selected ? (
          <ComponentCanvas key={selected.id} component={selected} theme={theme} />
        ) : (
          <ComponentsIntro totalOverrides={totalOverrides} componentCount={MANIFEST.length} />
        )}
      </div>
    </div>
  );
}

// ── Component canvas ──────────────────────────────────────────────────────────

interface ComponentCanvasProps {
  component: ComponentDef;
  theme: ThemeState;
}

function ComponentCanvas({ component, theme }: ComponentCanvasProps) {
  const [resetKey, setResetKey] = useState(0);
  const overrideCount = component.vars.filter((v) => theme.isModified(v.var)).length;
  const PreviewComponent = PREVIEWS[component.id];

  const handleResetAll = () => {
    component.vars.forEach((v) => {
      theme.resetVar(v.var);
      // Clear from the DOM immediately so resolveColorVarToHex reads the
      // correct cascaded default when ColorVarControl remounts this render.
      // useTheme's applyToRoot effect runs after the render (via useEffect),
      // which is too late — setTimeout(0) fires before useEffect.
      document.documentElement.style.removeProperty(v.var);
    });
    setResetKey((k) => k + 1);
  };

  const handleResetVar = (varName: string) => {
    theme.resetVar(varName);
    document.documentElement.style.removeProperty(varName);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="comp-canvas">
      {/* Header */}
      <div className="comp-canvas__header">
        <div className="comp-canvas__title-row">
          <h2 className="comp-canvas__title">{component.label}</h2>
          {overrideCount > 0 && (
            <span className="comp-canvas__override-badge">
              {overrideCount} override{overrideCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {overrideCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleResetAll}>
            Reset all
          </Button>
        )}
      </div>

      {/* Live preview */}
      <Card>
        <CardHeader>
          <span className="comp-canvas__section-label">Live preview</span>
        </CardHeader>
        <CardContent>
          {PreviewComponent ? (
            <PreviewComponent />
          ) : (
            <div className="comp-canvas__no-preview">
              <span className="comp-canvas__no-preview-text">
                No inline preview — open in{' '}
                <a
                  href="https://lelandrangel.com/pitchfork-ui/"
                  target="_blank"
                  rel="noreferrer"
                  className="comp-canvas__storybook-link"
                >
                  Storybook
                </a>{' '}
                to interact with the full component.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CSS Variables */}
      <Card>
        <CardHeader>
          <span className="comp-canvas__section-label">
            CSS Variables <span className="comp-canvas__var-count">({component.vars.length})</span>
          </span>
          <p className="comp-canvas__var-hint">
            Click a swatch to override the variable with a concrete color. Live swatches always show
            the resolved current value.
          </p>
        </CardHeader>
        <CardContent>
          <div className="comp-vars-list">
            {component.vars.map((def) =>
              def.type === 'color' ? (
                <ColorVarControl
                  key={def.var + resetKey}
                  def={def}
                  theme={theme}
                  resetKey={resetKey}
                  onReset={handleResetVar}
                />
              ) : (
                <SizeVarControl
                  key={def.var}
                  def={def}
                  theme={theme}
                  resetKey={resetKey}
                  onReset={handleResetVar}
                />
              ),
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
