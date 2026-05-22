import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Card,
  LoadingDots,
  LoadingSkeleton,
  LoadingSpinner,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Loading Indicators',
  component: LoadingSpinner,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SpinnerSizes: Story = {
  args: {
    size: 24,
  },
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
      <LoadingSpinner size={16} label="Loading small" />
      <LoadingSpinner size={24} label="Loading medium" />
      <LoadingSpinner size={36} label="Loading large" />
    </div>
  ),
};

export const DotsVariants: Story = {
  args: {
    size: 24,
  },
  render: () => (
    <div style={{ alignItems: 'center', display: 'flex', gap: 16 }}>
      <LoadingDots size="sm" label="Loading small" />
      <LoadingDots size="md" label="Loading medium" />
      <LoadingDots size="lg" label="Loading large" />
    </div>
  ),
};

export const SkeletonContentBlock: Story = {
  args: {
    size: 24,
  },
  render: () => (
    <Card style={{ display: 'grid', gap: 12, maxWidth: 380, padding: 16 }}>
      <LoadingSkeleton width="55%" height={16} />
      <LoadingSkeleton width="100%" height={14} />
      <LoadingSkeleton width="92%" height={14} />
      <LoadingSkeleton width="75%" height={14} />
      <LoadingSkeleton width={120} height={30} rounded />
    </Card>
  ),
};
