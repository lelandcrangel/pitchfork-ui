import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, UtilityButton } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Utility Button',
  component: UtilityButton,
  tags: ['ai-generated', 'test'],
  args: {
    children: 'Quick action',
    variant: 'neutral',
    size: 'md',
    icon: <Icon name="circle-dot" aria-hidden />,
  },
  argTypes: {
    variant: { control: 'select', options: ['neutral', 'brand', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof UtilityButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <UtilityButton {...args} />,
};
