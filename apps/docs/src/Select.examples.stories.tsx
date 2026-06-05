import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Select, type SelectOption } from '@pitchfork-ui/react';

const options: SelectOption[] = [
  { value: 'starter', label: 'Starter plan' },
  { value: 'pro', label: 'Pro plan' },
  { value: 'enterprise', label: 'Enterprise plan', disabled: true },
];

const optionsCode = `const options = [
  { value: 'starter', label: 'Starter plan' },
  { value: 'pro', label: 'Pro plan' },
  { value: 'enterprise', label: 'Enterprise plan', disabled: true },
];`;

const meta = {
  title: 'Examples/Select',
  component: Select,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Pricing tier',
    description: 'Choose the plan that fits your team.',
    placeholder: 'Choose a plan',
    options,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Select {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Select
  label="Pricing tier"
  description="Choose the plan that fits your team."
  placeholder="Choose a plan"
  options={options}
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: /pricing tier/i });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole('option', { name: /pro plan/i }));
    await expect(trigger).toHaveTextContent(/pro plan/i);
  },
};

export const WithDefaultValue: Story = {
  args: { defaultValue: 'starter' },
  render: (args) => <Select {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Select
  label="Pricing tier"
  description="Choose the plan that fits your team."
  placeholder="Choose a plan"
  options={options}
  defaultValue="starter"
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Please select a plan before continuing.' },
  render: (args) => <Select {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Select
  label="Pricing tier"
  description="Choose the plan that fits your team."
  placeholder="Choose a plan"
  options={options}
  error="Please select a plan before continuing."
/>`,
      },
    },
  },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: /pricing tier/i });
    await expect(trigger).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <Select {...args} />,
  parameters: {
    docs: {
      source: {
        code: `${optionsCode}

<Select
  label="Pricing tier"
  description="Choose the plan that fits your team."
  placeholder="Choose a plan"
  options={options}
  disabled
/>`,
      },
    },
  },
};
