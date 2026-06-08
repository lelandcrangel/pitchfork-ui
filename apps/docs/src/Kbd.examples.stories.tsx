import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Kbd',
  component: Kbd,
  tags: ['test', 'examplesHidden'],
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

export const SingleKeys: Story = {
  name: 'Single keys',
  render: () => (
    <div style={rowStyle}>
      <Kbd>Esc</Kbd>
      <Kbd>Tab</Kbd>
      <Kbd>Enter</Kbd>
      <Kbd>Space</Kbd>
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Kbd>Esc</Kbd>
<Kbd>Tab</Kbd>
<Kbd>Enter</Kbd>
<Kbd>Space</Kbd>`,
      },
    },
  },
};

export const Combos: Story = {
  render: () => (
    <div style={rowStyle}>
      <Kbd keys={['⌘', 'K']} />
      <Kbd keys={['Ctrl', 'Shift', 'P']} />
      <Kbd keys={['⌘', '⇧', 'Z']} />
    </div>
  ),
  parameters: {
    docs: {
      source: {
        code: `<Kbd keys={['⌘', 'K']} />
<Kbd keys={['Ctrl', 'Shift', 'P']} />
<Kbd keys={['⌘', '⇧', 'Z']} />`,
      },
    },
  },
};

export const Inline: Story = {
  name: 'Inline in text',
  render: () => (
    <p style={{ maxWidth: 420, lineHeight: 1.8 }}>
      Press <Kbd keys={['⌘', 'K']} size="sm" /> to open the command palette, or{' '}
      <Kbd size="sm">Esc</Kbd> to close it.
    </p>
  ),
  parameters: {
    docs: {
      source: {
        code: `<p>
  Press <Kbd keys={['⌘', 'K']} size="sm" /> to open the command palette, or{' '}
  <Kbd size="sm">Esc</Kbd> to close it.
</p>`,
      },
    },
  },
};
