import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from '@pitchfork-ui/react';

const items = [
  {
    value: 'shipping',
    title: 'How long does shipping take?',
    content:
      'Standard shipping takes 3–5 business days. Express options are available at checkout.',
  },
  {
    value: 'returns',
    title: 'What is your return policy?',
    content: 'Items can be returned within 30 days of delivery for a full refund.',
  },
  {
    value: 'support',
    title: 'How do I contact support?',
    content: 'Reach our team any time at support@example.com — we reply within one business day.',
  },
];

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  tags: ['test'],
  args: {
    items,
    type: 'single',
    headingLevel: 3,
  },
  argTypes: {
    type: { control: 'inline-radio', options: ['single', 'multiple'] },
    headingLevel: { control: { type: 'number', min: 2, max: 6 } },
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Accordion {...args} />,
};
