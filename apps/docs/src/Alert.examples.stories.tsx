import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Alert } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Alert',
  component: Alert,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    heading: 'Heads up',
    description: 'This is an informational alert message.',
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {
  args: {
    variant: 'info',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    heading: 'Saved successfully',
    description: 'Your settings have been updated.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    heading: 'Storage almost full',
    description: 'You have less than 10% storage remaining.',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    heading: 'Action failed',
    description: 'We could not process your request. Please try again.',
  },
};

export const Dismissible: Story = {
  args: {
    dismissible: true,
    onDismiss: fn(),
  },
};
