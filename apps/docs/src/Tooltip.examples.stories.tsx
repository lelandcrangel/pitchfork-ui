import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Tooltip',
  component: Tooltip,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    content: 'This action saves your current workspace.',
    placement: 'top',
    delay: 120,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Top tooltip</Button>
    </Tooltip>
  ),
};

export const Bottom: Story = {
  args: {
    placement: 'bottom',
    content: 'Available after payment is confirmed.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Bottom tooltip</Button>
    </Tooltip>
  ),
};

export const Left: Story = {
  args: {
    placement: 'left',
    content: 'This field is synced across all projects.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Left tooltip</Button>
    </Tooltip>
  ),
};

export const Right: Story = {
  args: {
    placement: 'right',
    content: 'Use this to open advanced settings.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Right tooltip</Button>
    </Tooltip>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    content: 'This should not appear while disabled.',
  },
  render: (args) => (
    <Tooltip {...args}>
      <Button>Disabled tooltip</Button>
    </Tooltip>
  ),
};
