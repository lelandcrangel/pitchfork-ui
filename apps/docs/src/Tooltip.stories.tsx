import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { Button, Tooltip } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['ai-generated', 'test'],
  args: {
    content: 'This action saves your current workspace.',
    open: false,
    placement: 'top',
    delay: 120,
    disabled: false,
  },
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
    },
    delay: {
      control: { type: 'number', min: 0, max: 1000, step: 20 },
    },
    open: { control: 'boolean' },
    disabled: { control: 'boolean' },
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

export const Interactive: Story = {
  render: ({ open, ...args }) => {
    const controlledOpen = open ? true : undefined;

    return (
      <TooltipStoryFrame>
        <Tooltip {...args} open={controlledOpen}>
          <Button>Hover me</Button>
        </Tooltip>
      </TooltipStoryFrame>
    );
  },
};
