import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup, Icon } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Button Group',
  component: ButtonGroup,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    'aria-label': 'Time range',
    items: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow' },
      { value: 'week', label: 'This week' },
    ],
    defaultValue: 'today',
  },
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: 'today' },
};

export const LeadingIcon: Story = {
  args: {
    'aria-label': 'Calendar range',
    items: [
      {
        value: 'today',
        label: 'Today',
        icon: <Icon name="calendar-days" aria-hidden />,
      },
      {
        value: 'tomorrow',
        label: 'Tomorrow',
        icon: <Icon name="calendar-days" aria-hidden />,
      },
      {
        value: 'week',
        label: 'This week',
        icon: <Icon name="calendar-days" aria-hidden />,
      },
    ],
    defaultValue: 'today',
  },
};

export const WithDot: Story = {
  args: {
    'aria-label': 'Status filters',
    items: [
      { value: 'draft', label: 'Draft', dot: true },
      { value: 'in-review', label: 'In review', dot: true },
      { value: 'published', label: 'Published', dot: true },
    ],
    defaultValue: 'in-review',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'today',
  },
};

export const DisabledItem: Story = {
  args: {
    items: [
      { value: 'today', label: 'Today' },
      { value: 'tomorrow', label: 'Tomorrow', disabled: true },
      { value: 'week', label: 'This week' },
    ],
    defaultValue: 'today',
  },
};

export const MultipleSelection: Story = {
  args: {
    'aria-label': 'Visible sections',
    multiple: true,
    items: [
      { value: 'overview', label: 'Overview' },
      { value: 'details', label: 'Details' },
      { value: 'activity', label: 'Activity' },
    ],
    defaultValue: ['overview', 'activity'],
  },
};
