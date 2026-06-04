import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { RadioButton } from '@pitchfork-ui/react';

const radioGroupStyle: React.CSSProperties = { display: 'grid', gap: 8 };

const meta = {
  title: 'Examples/Radio Buttons',
  component: RadioButton,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Email notifications',
    name: 'notification-preference',
  },
} satisfies Meta<typeof RadioButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: {
    label: 'Product updates',
    name: 'product-updates',
    defaultChecked: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText(/product updates/i)).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled option',
    name: 'disabled-option',
    disabled: true,
  },
};

export const Pair: Story = {
  render: () => (
    <div style={radioGroupStyle}>
      <RadioButton label="Starter" name="plan" defaultChecked />
      <RadioButton label="Pro" name="plan" />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<RadioButton label="Starter" name="plan" defaultChecked />
<RadioButton label="Pro" name="plan" />`,
      },
    },
  },
};
