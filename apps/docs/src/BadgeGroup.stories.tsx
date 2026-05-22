import type { Meta, StoryObj } from '@storybook/react-vite';
import { BadgeGroup } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Badge Group',
  component: BadgeGroup,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'New feature',
    message: "We've just released a new feature",
    color: 'brand',
    appearance: 'pill',
    badgePosition: 'leading',
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['gray', 'brand', 'error', 'warning', 'success'],
    },
    appearance: {
      control: 'select',
      options: ['pill', 'modern'],
    },
    badgePosition: {
      control: 'select',
      options: ['leading', 'trailing'],
    },
  },
} satisfies Meta<typeof BadgeGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
