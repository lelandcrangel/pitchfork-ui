import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Tooltip } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['ai-generated', 'test'],
  args: {
    content: 'This action saves your current workspace.',
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
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button>Hover me</Button>
    </Tooltip>
  ),
};
