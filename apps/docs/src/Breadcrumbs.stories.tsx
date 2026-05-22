import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  tags: ['ai-generated', 'test'],
  args: {
    items: [
      { label: 'Home', href: '#' },
      { label: 'Settings', href: '#' },
      { label: 'Billing' },
    ],
    separator: '/',
  },
  argTypes: {
    separator: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Breadcrumbs {...args} />,
};
