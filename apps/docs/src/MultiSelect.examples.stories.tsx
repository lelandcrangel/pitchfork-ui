import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { MultiSelect, type MultiSelectOption } from '@pitchfork-ui/react';

const options: MultiSelectOption[] = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'figma', label: 'Figma', disabled: true },
];

const defaultSelectedOptions = ['react', 'storybook'];
const disabledSelectedOptions = ['react'];

const optionsCode = `const options = [
  { value: 'react', label: 'React' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'storybook', label: 'Storybook' },
  { value: 'figma', label: 'Figma', disabled: true },
];`;

const meta = {
  title: 'Examples/Multi Select',
  component: MultiSelect,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Tech stack',
    description: 'Select all tools your team uses daily.',
    placeholder: 'Choose one or more',
    options,
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <MultiSelect {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<MultiSelect
  label="Tech stack"
  description="Select all tools your team uses daily."
  placeholder="Choose one or more"
  options={options}
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /tech stack/i });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('option', { name: /react/i }));
    await userEvent.click(canvas.getByRole('option', { name: /typescript/i }));
    await expect(trigger).toHaveTextContent(/react/i);
    await expect(trigger).toHaveTextContent(/typescript/i);
  },
};

export const WithDefaultValues: Story = {
  args: { defaultValue: defaultSelectedOptions },
  render: (args) => <MultiSelect {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

const defaultValue = ['react', 'storybook'];

<MultiSelect
  label="Tech stack"
  description="Select all tools your team uses daily."
  placeholder="Choose one or more"
  options={options}
  defaultValue={defaultValue}
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Select at least two tools before continuing.' },
  render: (args) => <MultiSelect {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<MultiSelect
  label="Tech stack"
  description="Select all tools your team uses daily."
  placeholder="Choose one or more"
  options={options}
  error="Select at least two tools before continuing."
/>`,
      },
    },
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: disabledSelectedOptions },
  render: (args) => <MultiSelect {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

const defaultValue = ['react'];

<MultiSelect
  label="Tech stack"
  description="Select all tools your team uses daily."
  placeholder="Choose one or more"
  options={options}
  defaultValue={defaultValue}
  disabled
/>`,
      },
    },
  },
};
