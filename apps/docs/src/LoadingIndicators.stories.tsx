import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  LoadingDots,
  LoadingSkeleton,
  LoadingSpinner,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Loading Indicators',
  component: LoadingSpinner,
  tags: ['ai-generated', 'test'],
  args: {
    size: 28,
    label: 'Loading',
  },
  argTypes: {
    label: {
      control: 'text',
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveSpinner: Story = {
  render: (args) => <LoadingSpinner {...args} />,
};

export const InteractiveDots: Story = {
  render: (args) => <LoadingDots size="md" label={args.label} />,
};

export const InteractiveSkeleton: Story = {
  render: (args) => (
    <LoadingSkeleton
      width={220}
      height={16}
      rounded={false}
      label={args.label}
    />
  ),
};
