import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar, ProgressCircle } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Progress Indicators',
  component: ProgressBar,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LinearDefault: Story = {
  args: {
    value: 32,
  },
  render: () => <ProgressBar value={32} />,
  parameters: {
    docs: {
      source: {
        code: `<ProgressBar value={32} />`,
      },
    },
  },
};

export const LinearComplete: Story = {
  args: {
    value: 100,
  },
  render: () => <ProgressBar value={100} />,
  parameters: {
    docs: {
      source: {
        code: `<ProgressBar value={100} />`,
      },
    },
  },
};

export const CircularDefault: Story = {
  args: {
    value: 68,
  },
  render: () => <ProgressCircle value={68} />,
  parameters: {
    docs: {
      source: {
        code: `<ProgressCircle value={68} />`,
      },
    },
  },
};

export const CircularLarge: Story = {
  args: {
    value: 84,
  },
  render: () => <ProgressCircle value={84} size={88} strokeWidth={8} />,
  parameters: {
    docs: {
      source: {
        code: `<ProgressCircle value={84} size={88} strokeWidth={8} />`,
      },
    },
  },
};
