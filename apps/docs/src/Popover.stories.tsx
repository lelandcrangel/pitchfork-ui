import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Popover } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  tags: ['test'],
  args: {
    align: 'start',
    label: 'Details',
    closeOnOutsideClick: true,
    trigger: <Button>Open popover</Button>,
    children: 'Popover content goes here.',
  },
  argTypes: {
    align: { control: 'inline-radio', options: ['start', 'end'] },
    closeOnOutsideClick: { control: 'boolean' },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <Popover {...args} trigger={<Button>Open popover</Button>}>
      <div style={{ display: 'grid', gap: 8, maxWidth: 240 }}>
        <strong>Popover title</strong>
        <span style={{ color: 'var(--color-semantic-text-muted)' }}>
          Anchored, dismissible content with focus management.
        </span>
      </div>
    </Popover>
  ),
};
