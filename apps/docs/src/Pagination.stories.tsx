import type { Meta, StoryObj } from '@storybook/react-vite';
import { Pagination } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Paginations',
  component: Pagination,
  tags: ['ai-generated', 'test'],
  args: {
    defaultPage: 8,
    totalPages: 20,
    siblingCount: 1,
    boundaryCount: 1,
    showPrevNext: true,
    disabled: false,
    prevLabel: 'Previous',
    nextLabel: 'Next',
  },
  argTypes: {
    onPageChange: { action: 'page changed' },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Pagination {...args} />,
};
