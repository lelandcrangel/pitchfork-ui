import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Combobox, type ComboboxOption } from '@pitchfork-ui/react';

const options: ComboboxOption[] = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'br', label: 'Brazil' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany', disabled: true },
  { value: 'jp', label: 'Japan' },
];

const optionsCode = `const options = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'mx', label: 'Mexico' },
  { value: 'br', label: 'Brazil' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'fr', label: 'France' },
  { value: 'de', label: 'Germany', disabled: true },
  { value: 'jp', label: 'Japan' },
];`;

const meta = {
  title: 'Examples/Combobox',
  component: Combobox,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Country',
    description: 'Start typing to filter the list.',
    placeholder: 'Search countries…',
    options,
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Combobox {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Combobox
  label="Country"
  description="Start typing to filter the list."
  placeholder="Search countries…"
  options={options}
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await userEvent.type(input, 'can');
    await userEvent.click(canvas.getByRole('option', { name: /canada/i }));
    await expect(input).toHaveValue('Canada');
  },
};

export const WithDefaultValue: Story = {
  args: { defaultValue: 'fr' },
  render: (args) => <Combobox {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Combobox
  label="Country"
  description="Start typing to filter the list."
  placeholder="Search countries…"
  options={options}
  defaultValue="fr"
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Select a country to continue.' },
  render: (args) => <Combobox {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Combobox
  label="Country"
  description="Start typing to filter the list."
  placeholder="Search countries…"
  options={options}
  error="Select a country to continue."
/>`,
      },
    },
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  },
};

export const Clearable: Story = {
  args: { defaultValue: 'fr' },
  render: (args) => <Combobox {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Combobox
  label="Country"
  description="Start typing to filter the list."
  placeholder="Search countries…"
  options={options}
  defaultValue="fr"
  clearable
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('combobox', { name: /country/i });
    await expect(input).toHaveValue('France');
    await userEvent.click(canvas.getByRole('button', { name: /clear/i }));
    await expect(input).toHaveValue('');
    await expect(input).toHaveFocus();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <Combobox {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Combobox
  label="Country"
  description="Start typing to filter the list."
  placeholder="Search countries…"
  options={options}
  disabled
/>`,
      },
    },
  },
};
