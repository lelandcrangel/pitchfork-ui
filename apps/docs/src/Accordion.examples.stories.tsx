import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion, type AccordionItemData } from '@pitchfork-ui/react';

const faqItems: AccordionItemData[] = [
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

const settingsItems: AccordionItemData[] = [
  { value: 'profile', title: 'Profile', content: 'Update your name, avatar, and contact details.' },
  {
    value: 'security',
    title: 'Security',
    content: 'Manage your password and two-factor authentication.',
  },
  { value: 'billing', title: 'Billing', content: 'View invoices and update your payment method.' },
  {
    value: 'legacy',
    title: 'Legacy data export',
    content: 'Unavailable on your current plan.',
    disabled: true,
  },
];

const meta = {
  title: 'Examples/Accordion',
  component: Accordion,
  tags: ['test', 'examplesHidden'],
  args: { items: [] },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FAQ: Story = {
  name: 'FAQ (single)',
  render: () => <Accordion items={faqItems} defaultValue={['shipping']} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'shipping', title: 'How long does shipping take?', content: 'Standard shipping takes 3–5 business days...' },
  { value: 'returns', title: 'What is your return policy?', content: 'Items can be returned within 30 days...' },
  { value: 'support', title: 'How do I contact support?', content: 'Reach our team any time at support@example.com...' },
];

<Accordion items={items} defaultValue={['shipping']} />`,
      },
    },
  },
};

export const Multiple: Story = {
  name: 'Multiple open',
  render: () => (
    <Accordion items={settingsItems} type="multiple" defaultValue={['profile', 'security']} />
  ),
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'profile', title: 'Profile', content: 'Update your name, avatar, and contact details.' },
  { value: 'security', title: 'Security', content: 'Manage your password and two-factor authentication.' },
  { value: 'billing', title: 'Billing', content: 'View invoices and update your payment method.' },
  { value: 'legacy', title: 'Legacy data export', content: 'Unavailable on your current plan.', disabled: true },
];

<Accordion items={items} type="multiple" defaultValue={['profile', 'security']} />`,
      },
    },
  },
};

export const WithDisabledItem: Story = {
  name: 'With disabled item',
  render: () => <Accordion items={settingsItems} />,
  parameters: {
    docs: {
      source: {
        code: `const items = [
  { value: 'profile', title: 'Profile', content: 'Update your name, avatar, and contact details.' },
  { value: 'security', title: 'Security', content: 'Manage your password and two-factor authentication.' },
  { value: 'billing', title: 'Billing', content: 'View invoices and update your payment method.' },
  { value: 'legacy', title: 'Legacy data export', content: 'Unavailable on your current plan.', disabled: true },
];

<Accordion items={items} />`,
      },
    },
  },
};
