import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Dashboard', href: '#' },
      { label: 'Projects', href: '#' },
      { label: 'Pitchfork UI' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ShortPath: Story = {
  args: {
    items: [{ label: 'Home', href: '#' }, { label: 'Profile' }],
  },
};

export const CustomSeparator: Story = {
  args: {
    separator: '>',
  },
};

export const CurrentInMiddle: Story = {
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Design', href: '#' },
      { label: 'Assets', current: true },
      { label: 'Unused', href: '#' },
    ],
  },
};
