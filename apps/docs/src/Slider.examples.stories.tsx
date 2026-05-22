import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Slider } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Slider',
  component: Slider,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    label: 'Satisfaction score',
    description: 'Choose a score between 0 and 100.',
    min: 0,
    max: 100,
    step: 1,
    defaultValue: 64,
    showValue: true,
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByRole('slider', { name: /satisfaction score/i });
    await expect(input).toHaveValue('64');
  },
};

export const PercentageRange: Story = {
  args: {
    label: 'Completion',
    min: 0,
    max: 100,
    defaultValue: 28,
  },
};

export const Stepped: Story = {
  args: {
    label: 'Seats',
    min: 1,
    max: 20,
    step: 1,
    defaultValue: 8,
  },
};

export const WithError: Story = {
  args: {
    error: 'Choose at least 40 before continuing.',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
