import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
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

const TooltipStoryFrame = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      alignItems: 'center',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      minHeight: 180,
      padding: '72px 160px',
      width: '100%',
    }}
  >
    {children}
  </div>
);

export const Top: Story = {
  render: (args) => (
    <TooltipStoryFrame>
      <Tooltip {...args}>
        <Button>Top tooltip</Button>
      </Tooltip>
    </TooltipStoryFrame>
  ),
};

export const Bottom: Story = {
  args: {
    placement: 'bottom',
    content: 'Available after payment is confirmed.',
  },
  render: (args) => (
    <TooltipStoryFrame>
      <Tooltip {...args}>
        <Button>Bottom tooltip</Button>
      </Tooltip>
    </TooltipStoryFrame>
  ),
};

export const Left: Story = {
  args: {
    placement: 'left',
    content: 'This field is synced across all projects.',
  },
  render: (args) => (
    <TooltipStoryFrame>
      <Tooltip {...args}>
        <Button>Left tooltip</Button>
      </Tooltip>
    </TooltipStoryFrame>
  ),
};

export const Right: Story = {
  args: {
    placement: 'right',
    content: 'Use this to open advanced settings.',
  },
  render: (args) => (
    <TooltipStoryFrame>
      <Tooltip {...args}>
        <Button>Right tooltip</Button>
      </Tooltip>
    </TooltipStoryFrame>
  ),
};

export const Disabled: Story = {
  args: {
    disabled: true,
    content: 'This should not appear while disabled.',
  },
  render: (args) => (
    <TooltipStoryFrame>
      <Tooltip {...args}>
        <Button>Disabled tooltip</Button>
      </Tooltip>
    </TooltipStoryFrame>
  ),
};
