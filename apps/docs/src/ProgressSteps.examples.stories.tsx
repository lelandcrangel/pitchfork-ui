import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProgressSteps, type ProgressStepItem } from '@pitchfork-ui/react';

const checkoutSteps: ProgressStepItem[] = [
  { title: 'Cart', description: 'Review items', status: 'complete' },
  { title: 'Shipping', description: 'Delivery address', status: 'complete' },
  { title: 'Payment', description: 'Choose payment method', status: 'current' },
  { title: 'Confirm', description: 'Place your order', status: 'upcoming' },
];

const onboardingSteps: ProgressStepItem[] = [
  { title: 'Workspace details', description: 'Name and region', status: 'complete' },
  { title: 'Security settings', description: 'Enable MFA', status: 'current' },
  { title: 'Team permissions', description: 'Set access levels', status: 'upcoming' },
  { title: 'Integrations', description: 'Connect third-party apps', status: 'upcoming' },
];

const autoStatusSteps: ProgressStepItem[] = [
  { title: 'Draft' },
  { title: 'Review', status: 'current' },
  { title: 'Approve' },
  { title: 'Publish' },
];

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
  render: () => <ProgressSteps steps={checkoutSteps} />,
  parameters: {
    docs: {
      source: {
        code: `const checkoutSteps = [
  { title: 'Cart', description: 'Review items', status: 'complete' },
  { title: 'Shipping', description: 'Delivery address', status: 'complete' },
  { title: 'Payment', description: 'Choose payment method', status: 'current' },
  { title: 'Confirm', description: 'Place your order', status: 'upcoming' },
];

<ProgressSteps steps={checkoutSteps} />`,
      },
    },
  },
};

export const VerticalOnboarding: Story = {
  render: () => <ProgressSteps orientation="vertical" steps={onboardingSteps} />,
  parameters: {
    docs: {
      source: {
        code: `const onboardingSteps = [
  { title: 'Workspace details', description: 'Name and region', status: 'complete' },
  { title: 'Security settings', description: 'Enable MFA', status: 'current' },
  { title: 'Team permissions', description: 'Set access levels', status: 'upcoming' },
  { title: 'Integrations', description: 'Connect third-party apps', status: 'upcoming' },
];

<ProgressSteps orientation="vertical" steps={onboardingSteps} />`,
      },
    },
  },
};

export const AutoStatusFromCurrent: Story = {
  render: () => <ProgressSteps steps={autoStatusSteps} />,
  parameters: {
    docs: {
      source: {
        code: `const autoStatusSteps = [
  { title: 'Draft' },
  { title: 'Review', status: 'current' },
  { title: 'Approve' },
  { title: 'Publish' },
];

<ProgressSteps steps={autoStatusSteps} />`,
      },
    },
  },
};
