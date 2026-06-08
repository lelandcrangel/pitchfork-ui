import type { Meta, StoryObj } from '@storybook/react-vite';
import { Resizable } from '@pitchfork-ui/react';

const panel: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  height: '100%',
  padding: 16,
  color: 'var(--color-semantic-text-muted)',
  background: 'var(--color-semantic-background-subtle)',
};

const frame: React.CSSProperties = {
  height: 240,
  border: '1px solid var(--color-semantic-border-default)',
  borderRadius: 8,
  overflow: 'hidden',
};

const meta = {
  title: 'Components/Resizable',
  component: Resizable,
  tags: ['ai-generated', 'test'],
  args: {
    orientation: 'horizontal',
    defaultSize: 50,
    min: 20,
    max: 80,
    step: 2,
    style: frame,
    children: null,
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    defaultSize: { control: { type: 'range', min: 10, max: 90 } },
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: 'number' },
  },
} satisfies Meta<typeof Resizable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <Resizable {...args}>
      <div style={panel}>Panel A</div>
      <div style={panel}>Panel B</div>
    </Resizable>
  ),
};
