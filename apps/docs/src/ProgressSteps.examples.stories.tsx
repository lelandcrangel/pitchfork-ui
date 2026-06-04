import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSteps } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Progress Steps',
  component: ProgressSteps,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    steps: [{ title: 'Step', description: 'Description' }],
  },
} satisfies Meta<typeof ProgressSteps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CheckoutFlow: Story = {
  render: () => (
    <ProgressSteps
      steps={[
        { title: 'Cart', description: 'Review items', status: 'complete' },
        {
          title: 'Shipping',
          description: 'Delivery address',
          status: 'complete',
        },
        {
          title: 'Payment',
          description: 'Choose payment method',
          status: 'current',
        },
        {
          title: 'Confirm',
          description: 'Place your order',
          status: 'upcoming',
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<ProgressSteps
  steps={[
    { title: 'Cart', description: 'Review items', status: 'complete' },
    { title: 'Shipping', description: 'Delivery address', status: 'complete' },
    { title: 'Payment', description: 'Choose payment method', status: 'current' },
    { title: 'Confirm', description: 'Place your order', status: 'upcoming' },
  ]}
/>`,
      },
    },
  },
};

export const VerticalOnboarding: Story = {
  render: () => (
    <ProgressSteps
      orientation="vertical"
      steps={[
        {
          title: 'Workspace details',
          description: 'Name and region',
          status: 'complete',
        },
        {
          title: 'Security settings',
          description: 'Enable MFA',
          status: 'current',
        },
        {
          title: 'Team permissions',
          description: 'Set access levels',
          status: 'upcoming',
        },
        {
          title: 'Integrations',
          description: 'Connect third-party apps',
          status: 'upcoming',
        },
      ]}
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<ProgressSteps
  orientation="vertical"
  steps={[
    { title: 'Workspace details', description: 'Name and region', status: 'complete' },
    { title: 'Security settings', description: 'Enable MFA', status: 'current' },
    { title: 'Team permissions', description: 'Set access levels', status: 'upcoming' },
    { title: 'Integrations', description: 'Connect third-party apps', status: 'upcoming' },
  ]}
/>`,
      },
    },
  },
};

export const AutoStatusFromCurrent: Story = {
  render: () => (
    <ProgressSteps
      steps={[
        { title: 'Draft' },
        { title: 'Review', status: 'current' },
        { title: 'Approve' },
        { title: 'Publish' },
      ]}
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<ProgressSteps
  steps={[
    { title: 'Draft' },
    { title: 'Review', status: 'current' },
    { title: 'Approve' },
    { title: 'Publish' },
  ]}
/>`,
      },
    },
  },
};
