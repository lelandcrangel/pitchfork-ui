import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox } from '@pitchfork-ui/react';

const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'br', label: 'Brazil' },
  { value: 'ar', label: 'Argentina' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany', disabled: true },
  { value: 'jp', label: 'Japan' },
  { value: 'au', label: 'Australia' },
];

const meta = {
  title: 'Components/Combobox',
  component: Combobox,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Country',
    description: 'Start typing to filter the list.',
    placeholder: 'Search countries…',
    emptyMessage: 'No matches',
    options,
    disabled: false,
    clearable: true,
  },
  argTypes: {
    label: { control: 'text' },
    description: { control: 'text' },
    placeholder: { control: 'text' },
    emptyMessage: { control: 'text' },
    error: { control: 'text' },
    disabled: { control: 'boolean' },
    required: { control: 'boolean' },
    clearable: { control: 'boolean' },
    options: { control: 'object' },
    style: { control: 'object' },
    onValueChange: { action: 'value changed' },
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    label: 'Interactive combobox',
    description: 'Filter, navigate with arrow keys, and select.',
    placeholder: 'Search countries…',
    options,
  },
};
