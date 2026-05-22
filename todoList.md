# React Components Todo List

Source baseline: https://www.untitledui.com/react/components

Scope for this list:

- Component parity tracking against Untitled UI React catalog
- Focused on component libraries, not full page examples
- Current implemented set in this repo: Badge, Button, ButtonGroup, Card, Checkbox, Input, Select, Switch

## 1) Base Components

### Already Implemented

- [x] Avatars
- [x] Badge groups
- [x] Badges
- [x] Buttons
- [x] Button groups
- [x] Checkboxes
- [x] Credit cards
- [x] Dropdowns
- [x] Inputs
- [x] Progress indicators
- [x] Select
- [x] Toggles (covered by Switch)

### Missing

- [x] Radio buttons
- [x] Radio groups
- [x] Rating badge and stars
- [x] Rich text editors
- [x] Multi select
- [x] Sliders
- [x] Tags
- [x] Textareas
- [x] Tooltips
- [x] Utility buttons
- [x] Icons (free https://github.com/FortAwesome/Font-Awesome)
- [x] Video players

## 2) Application UI Components

### Already Implemented (Partial Category Coverage)

- [x] Card headers (partially covered by Card + CardHeader)

### Missing

- [x] Alerts
- [x] Breadcrumbs
- [x] Calendars
- [x] Carousels
- [x] Code snippets
- [x] Content dividers
- [x] Date pickers
- [x] File uploaders
- [x] Header navigations
- [x] Inline CTAs
- [x] Loading indicators
- [x] Metrics
- [x] Modals
- [x] Notifications
- [x] Page headers
- [x] Paginations
- [x] Pie charts
- [x] Progress steps
- [x] Radar charts
- [x] Section footers
- [ ] Section headers
- [ ] Sidebar navigations
- [ ] Slideout menus
- [ ] Tables
- [ ] Tabs
- [ ] Tree views

## 3) Notes

- Keep each new component aligned with existing package patterns:
  - colocated component folder in packages/react/src/components
  - exported via packages/react/src/index.ts
  - Docs + Interactive stories structure in apps/docs/src
- Prefer alias tokens in theme.css for component theming consistency.
