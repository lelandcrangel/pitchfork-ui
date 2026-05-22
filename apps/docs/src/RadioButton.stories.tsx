import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioButton } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Radio Buttons',
  component: RadioButton,
  tags: ['ai-generated', 'test'],
  args: {
    label: 'Email notifications',
    name: 'notification-preference',
  },
} satisfies Meta<typeof RadioButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <RadioButton {...args} />,
};
