import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingBadge, RatingStars } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Rating',
  component: RatingStars,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    value: 4.6,
    max: 5,
    size: 18,
    showValue: true,
  },
} satisfies Meta<typeof RatingStars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StarsDefault: Story = {};

export const StarsCompact: Story = {
  args: {
    value: 3.8,
    size: 14,
    showValue: false,
  },
};

export const StarsLarge: Story = {
  args: {
    value: 4.9,
    size: 24,
  },
};

export const BadgeDefault: Story = {
  render: () => <RatingBadge value={4.8} reviews={2048} />,
  parameters: {
    docs: {
      source: {
        code: `<RatingBadge value={4.8} reviews={2048} />`,
      },
    },
  },
};

export const BadgeSmall: Story = {
  render: () => <RatingBadge value={4.2} reviews={324} size="sm" />,
  parameters: {
    docs: {
      source: {
        code: `<RatingBadge value={4.2} reviews={324} size="sm" />`,
      },
    },
  },
};
