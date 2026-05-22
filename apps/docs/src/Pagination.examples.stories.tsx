import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Pagination',
  component: Pagination,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    totalPages: 15,
    defaultPage: 1,
  },
  argTypes: {
    onPageChange: { action: 'page changed' },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    defaultPage: 8,
  },
};

export const CompactNumbers: Story = {
  args: {
    defaultPage: 12,
    totalPages: 24,
    siblingCount: 0,
  },
};

export const NumbersOnly: Story = {
  args: {
    defaultPage: 4,
    totalPages: 9,
    showPrevNext: false,
  },
};

export const Disabled: Story = {
  args: {
    defaultPage: 3,
    totalPages: 10,
    disabled: true,
  },
};
