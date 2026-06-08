import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapsible } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Collapsible',
  component: Collapsible,
  tags: ['ai-generated', 'test'],
  args: {
    trigger: 'Show details',
    defaultOpen: false,
    disabled: false,
    showChevron: true,
    children: 'This content expands and collapses with an animated height transition.',
  },
  argTypes: {
    trigger: { control: 'text' },
    defaultOpen: { control: 'boolean' },
    disabled: { control: 'boolean' },
    showChevron: { control: 'boolean' },
    children: { control: 'text' },
    onOpenChange: { action: 'open changed' },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    trigger: 'What is your refund policy?',
    children:
      'You can request a full refund within 30 days of purchase, no questions asked. After 30 days, refunds are handled case by case.',
  },
};
