import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { NumberInput } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/NumberInput',
  component: NumberInput,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Quantity',
    description: 'Use the steppers or type a value.',
    min: 0,
    max: 100,
    defaultValue: 1,
  },
} satisfies Meta<typeof NumberInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <NumberInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<NumberInput
  label="Quantity"
  description="Use the steppers or type a value."
  min={0}
  max={100}
  defaultValue={1}
/>`,
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('spinbutton', { name: /quantity/i });
    await userEvent.click(canvas.getByRole('button', { name: /increase/i }));
    await expect(input).toHaveValue('2');
  },
};

export const WithStep: Story = {
  name: 'Decimal step',
  args: { label: 'Amount', step: 0.5, min: 0, max: 10, defaultValue: 2.5 },
  render: (args) => <NumberInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<NumberInput
  label="Amount"
  step={0.5}
  min={0}
  max={10}
  defaultValue={2.5}
/>`,
      },
    },
  },
};

export const Currency: Story = {
  args: {
    label: 'Price',
    description: 'Formatted as currency while not editing.',
    step: 1,
    min: 0,
    max: 100000,
    defaultValue: 1299,
    formatOptions: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
    locale: 'en-US',
  },
  render: (args) => <NumberInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<NumberInput
  label="Price"
  description="Formatted as currency while not editing."
  min={0}
  max={100000}
  step={1}
  defaultValue={1299}
  formatOptions={{ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }}
  locale="en-US"
/>`,
      },
    },
  },
};

export const WithError: Story = {
  args: { error: 'Enter a quantity of at least 1.', defaultValue: 0 },
  render: (args) => <NumberInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<NumberInput
  label="Quantity"
  description="Use the steppers or type a value."
  min={0}
  max={100}
  defaultValue={0}
  error="Enter a quantity of at least 1."
/>`,
      },
    },
  },
  play: async ({ canvas }) => {
    const input = canvas.getByRole('spinbutton', { name: /quantity/i });
    await expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 3 },
  render: (args) => <NumberInput {...args} />,
  parameters: {
    docs: {
      source: {
        code: `<NumberInput
  label="Quantity"
  description="Use the steppers or type a value."
  min={0}
  max={100}
  defaultValue={3}
  disabled
/>`,
      },
    },
  },
};
