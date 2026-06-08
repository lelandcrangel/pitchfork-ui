import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Input, Popover } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Popover',
  component: Popover,
  tags: ['test', 'examplesHidden'],
  args: { trigger: <Button>Open</Button>, children: null },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelStyle: React.CSSProperties = { display: 'grid', gap: 12, maxWidth: 260 };
const titleStyle: React.CSSProperties = { margin: 0, fontSize: '0.9375rem', fontWeight: 600 };
const textStyle: React.CSSProperties = { margin: 0, color: 'var(--color-semantic-text-muted)' };

export const Info: Story = {
  render: () => (
    <Popover label="About this metric" trigger={<Button variant="secondary">What is MRR?</Button>}>
      <div style={panelStyle}>
        <p style={titleStyle}>Monthly Recurring Revenue</p>
        <p style={textStyle}>
          The normalized monthly value of all active subscriptions, excluding one-time charges.
        </p>
      </div>
    </Popover>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Popover label="About this metric" trigger={<Button variant="secondary">What is MRR?</Button>}>
  <div>
    <p>Monthly Recurring Revenue</p>
    <p>The normalized monthly value of all active subscriptions, excluding one-time charges.</p>
  </div>
</Popover>`,
      },
    },
  },
};

export const FormPanel: Story = {
  name: 'Form panel',
  render: () => (
    <Popover label="Rename" trigger={<Button>Rename project</Button>}>
      <div style={panelStyle}>
        <Input label="Project name" defaultValue="Pitchfork UI" />
        <Button size="sm">Save</Button>
      </div>
    </Popover>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Popover label="Rename" trigger={<Button>Rename project</Button>}>
  <div style={{ display: 'grid', gap: 12 }}>
    <Input label="Project name" defaultValue="Pitchfork UI" />
    <Button size="sm">Save</Button>
  </div>
</Popover>`,
      },
    },
  },
};

export const AlignEnd: Story = {
  name: 'Aligned to end',
  render: () => (
    <Popover align="end" label="Menu" trigger={<Button variant="secondary">Options</Button>}>
      <div style={panelStyle}>
        <p style={textStyle}>The panel's right edge aligns to the trigger's right edge.</p>
      </div>
    </Popover>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Popover align="end" label="Menu" trigger={<Button variant="secondary">Options</Button>}>
  <div>…</div>
</Popover>`,
      },
    },
  },
};
