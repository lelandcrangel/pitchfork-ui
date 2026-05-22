import type { Meta, StoryObj } from '@storybook/react-vite';
import { BadgeGroup } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Badge Group',
  component: BadgeGroup,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof BadgeGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PillLeadingBrand: Story = {
  args: {
    label: 'New feature',
    message: "We've just released a new feature",
    appearance: 'pill',
    color: 'brand',
    badgePosition: 'leading',
  },
};

export const PillTrailingSuccess: Story = {
  args: {
    label: 'Success',
    message: "You've updated your profile and details",
    appearance: 'pill',
    color: 'success',
    badgePosition: 'trailing',
  },
};

export const ModernLeadingWarning: Story = {
  args: {
    label: 'Warning',
    message: 'Just to let you know this might be a problem',
    appearance: 'modern',
    color: 'warning',
    badgePosition: 'leading',
  },
};

export const ModernTrailingError: Story = {
  args: {
    label: 'Error',
    message: 'There was a problem with that action',
    appearance: 'modern',
    color: 'error',
    badgePosition: 'trailing',
  },
};
