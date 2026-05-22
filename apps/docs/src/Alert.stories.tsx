import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Alert',
  component: Alert,
  tags: ['ai-generated', 'test'],
  args: {
    variant: 'info',
    heading: 'Heads up',
    description: 'This is an informational alert message.',
    dismissible: false,
  },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger'],
    },
    dismissible: { control: 'boolean' },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: (args) => <Alert {...args} />,
};
