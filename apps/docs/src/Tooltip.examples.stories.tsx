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

const tooltipFrameStyle: React.CSSProperties = {
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  minHeight: 180,
  padding: '72px 160px',
  width: '100%',
};

const TooltipStoryFrame = ({ children }: { children: ReactNode }) => (
  <div style={tooltipFrameStyle}>
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
  parameters: {
    docs: {
      source: {
        code: `<Tooltip content="This action saves your current workspace." placement="top">
  <Button>Top tooltip</Button>
</Tooltip>`,
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<Tooltip content="Available after payment is confirmed." placement="bottom">
  <Button>Bottom tooltip</Button>
</Tooltip>`,
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<Tooltip content="This field is synced across all projects." placement="left">
  <Button>Left tooltip</Button>
</Tooltip>`,
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<Tooltip content="Use this to open advanced settings." placement="right">
  <Button>Right tooltip</Button>
</Tooltip>`,
      },
    },
  },
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
  parameters: {
    docs: {
      source: {
        code: `<Tooltip content="This should not appear while disabled." disabled>
  <Button>Disabled tooltip</Button>
</Tooltip>`,
      },
    },
  },
};
