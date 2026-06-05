import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, Icon, type ButtonGroupItem } from '@pitchfork-ui/react';

const timeRangeItems: ButtonGroupItem[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
];

const calendarItems: ButtonGroupItem[] = [
  { value: 'today', label: 'Today', icon: <Icon name="calendar" aria-hidden /> },
  { value: 'tomorrow', label: 'Tomorrow', icon: <Icon name="calendar" aria-hidden /> },
  { value: 'week', label: 'This week', icon: <Icon name="calendar" aria-hidden /> },
];

const dotItems: ButtonGroupItem[] = [
  { value: 'draft', label: 'Draft', dot: true },
  { value: 'in-review', label: 'In review', dot: true },
  { value: 'published', label: 'Published', dot: true },
];

const disabledItemItems: ButtonGroupItem[] = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow', disabled: true },
  { value: 'week', label: 'This week' },
];

const sectionItems: ButtonGroupItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details' },
  { value: 'activity', label: 'Activity' },
];

const multipleDefaultValue = ['overview', 'activity'];

const meta = {
  title: 'Examples/Button Group',
  component: ButtonGroup,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    'aria-label': 'Time range',
    items: timeRangeItems,
    defaultValue: 'today',
    multiple: false,
    disabled: false,
  },
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
];

<ButtonGroup aria-label="Time range" items={items} defaultValue="today" />`,
      },
    },
  },
};

export const LeadingIcon: Story = {
  args: {
    'aria-label': 'Calendar range',
    items: calendarItems,
    defaultValue: 'today',
  },
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'today', label: 'Today', icon: <Icon name="calendar" aria-hidden /> },
  { value: 'tomorrow', label: 'Tomorrow', icon: <Icon name="calendar" aria-hidden /> },
  { value: 'week', label: 'This week', icon: <Icon name="calendar" aria-hidden /> },
];

<ButtonGroup aria-label="Calendar range" items={items} defaultValue="today" />`,
      },
    },
  },
};

export const WithDot: Story = {
  args: {
    'aria-label': 'Status filters',
    items: dotItems,
    defaultValue: 'in-review',
  },
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'draft', label: 'Draft', dot: true },
  { value: 'in-review', label: 'In review', dot: true },
  { value: 'published', label: 'Published', dot: true },
];

<ButtonGroup aria-label="Status filters" items={items} defaultValue="in-review" />`,
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'today',
  },
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This week' },
];

<ButtonGroup aria-label="Time range" items={items} defaultValue="today" disabled />`,
      },
    },
  },
};

export const DisabledItem: Story = {
  args: {
    items: disabledItemItems,
    defaultValue: 'today',
  },
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow', disabled: true },
  { value: 'this-week', label: 'This week' },
];

<ButtonGroup aria-label="Time range" items={items} defaultValue="today" />`,
      },
    },
  },
};

export const MultipleSelection: Story = {
  args: {
    'aria-label': 'Visible sections',
    multiple: true,
    items: sectionItems,
    defaultValue: multipleDefaultValue,
  },
  render: (args) => <ButtonGroup {...args} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'overview', label: 'Overview' },
  { value: 'details', label: 'Details' },
  { value: 'activity', label: 'Activity' },
];

const defaultValue = ['overview', 'activity'];

<ButtonGroup
  aria-label="Visible sections"
  items={items}
  defaultValue={defaultValue}
  multiple
/>`,
      },
    },
  },
};
