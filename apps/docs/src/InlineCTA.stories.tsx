import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, InlineCTA } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/InlineCTA',
  component: InlineCTA,
  tags: ['ai-generated', 'test'],
  args: {
    heading: 'Upgrade available',
    description: 'Unlock additional features by upgrading your plan.',
    tone: 'default',
    action: <Button size="sm">Upgrade</Button>,
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['default', 'info', 'success', 'warning'],
    },
    action: { control: false },
    icon: { control: false },
  },
} satisfies Meta<typeof InlineCTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <InlineCTA {...args} />,
};
