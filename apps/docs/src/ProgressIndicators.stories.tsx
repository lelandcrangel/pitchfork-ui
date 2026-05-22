import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressBar, ProgressCircle } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Progress Indicators',
  component: ProgressBar,
  tags: ['ai-generated', 'test'],
  args: {
    value: 62,
    max: 100,
    showValue: true,
  },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <ProgressBar {...args} />,
};

export const InteractiveCircle: Story = {
  render: (args) => (
    <ProgressCircle
      value={args.value ?? 62}
      max={args.max ?? 100}
      showValue={args.showValue}
    />
  ),
};
