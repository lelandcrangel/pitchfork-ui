import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingBadge, RatingStars } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Rating',
  component: RatingStars,
  tags: ['ai-generated', 'test'],
  args: {
    value: 4.2,
    max: 5,
    size: 18,
    showValue: true,
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 5, step: 0.1 } },
    max: { control: { type: 'number', min: 1, step: 1 } },
    size: { control: { type: 'number', min: 12, max: 40, step: 1 } },
    showValue: { control: 'boolean' },
  },
} satisfies Meta<typeof RatingStars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveStars: Story = {
  render: (args) => <RatingStars {...args} />,
};

export const InteractiveBadge: Story = {
  render: (args) => (
    <RatingBadge value={args.value ?? 4.2} max={args.max ?? 5} reviews={1284} size="md" />
  ),
};
