import type { Meta, StoryObj } from '@storybook/react-vite';
import { Collapsible } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Collapsible',
  component: Collapsible,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: { trigger: 'Toggle', children: 'Content' },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Collapsible trigger="Show shipping details">
      <p style={{ margin: 0 }}>
        Orders ship within 2 business days. Standard delivery takes 3–5 days; expedited options are
        available at checkout.
      </p>
    </Collapsible>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Collapsible trigger="Show shipping details">
  <p>Orders ship within 2 business days. Standard delivery takes 3–5 days;
     expedited options are available at checkout.</p>
</Collapsible>`,
      },
    },
  },
};

export const DefaultOpen: Story = {
  name: 'Open by default',
  render: () => (
    <Collapsible trigger="Account settings" defaultOpen>
      <p style={{ margin: 0 }}>This section starts expanded via the defaultOpen prop.</p>
    </Collapsible>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Collapsible trigger="Account settings" defaultOpen>
  <p>This section starts expanded via the defaultOpen prop.</p>
</Collapsible>`,
      },
    },
  },
};

export const FaqList: Story = {
  name: 'Stacked (FAQ)',
  render: () => (
    <div style={{ display: 'grid', gap: 8, maxWidth: 480 }}>
      <Collapsible trigger="Do you offer a free trial?">
        <p style={{ margin: 0 }}>Yes — 14 days, no credit card required.</p>
      </Collapsible>
      <Collapsible trigger="Can I change plans later?">
        <p style={{ margin: 0 }}>
          Absolutely. Upgrade or downgrade at any time from billing settings.
        </p>
      </Collapsible>
      <Collapsible trigger="How do I cancel?">
        <p style={{ margin: 0 }}>
          Cancel in one click from your account page; access continues until period end.
        </p>
      </Collapsible>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<div style={{ display: 'grid', gap: 8 }}>
  <Collapsible trigger="Do you offer a free trial?">
    <p>Yes — 14 days, no credit card required.</p>
  </Collapsible>
  <Collapsible trigger="Can I change plans later?">
    <p>Absolutely. Upgrade or downgrade at any time from billing settings.</p>
  </Collapsible>
  <Collapsible trigger="How do I cancel?">
    <p>Cancel in one click from your account page; access continues until period end.</p>
  </Collapsible>
</div>`,
      },
    },
  },
};
