import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Button, ProgressSteps, type ProgressStepItem } from '@pitchfork-ui/react';

const advancingSteps = ['Account', 'Profile', 'Billing', 'Done'];

const advancingWrapStyle: React.CSSProperties = { display: 'grid', gap: 24 };
const advancingButtonRowStyle: React.CSSProperties = { display: 'flex', gap: 8 };

function AdvancingDemo() {
  const [current, setCurrent] = useState(1);

  const steps: ProgressStepItem[] = advancingSteps.map((title, index) => ({
    title,
    status: index < current ? 'complete' : index === current ? 'current' : 'upcoming',
  }));

  return (
    <div style={advancingWrapStyle}>
      <ProgressSteps steps={steps} />
      <div style={advancingButtonRowStyle}>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
        >
          Back
        </Button>
        <Button
          size="sm"
          onClick={() => setCurrent((c) => Math.min(advancingSteps.length - 1, c + 1))}
          disabled={current === advancingSteps.length - 1}
        >
          Next
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setCurrent(0)}>
          Reset
        </Button>
      </div>
    </div>
  );
}

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

export const Advancing: Story = {
  name: 'Advancing (interactive)',
  render: () => <AdvancingDemo />,
  parameters: {
    docs: {
      source: {
        code: `const labels = ['Account', 'Profile', 'Billing', 'Done'];

function AdvancingDemo() {
  const [current, setCurrent] = useState(1);

  const steps = labels.map((title, index) => ({
    title,
    status: index < current ? 'complete' : index === current ? 'current' : 'upcoming',
  }));

  return (
    <>
      <ProgressSteps steps={steps} />
      <Button size="sm" variant="secondary" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
        Back
      </Button>
      <Button size="sm" onClick={() => setCurrent((c) => Math.min(labels.length - 1, c + 1))}>
        Next
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setCurrent(0)}>
        Reset
      </Button>
    </>
  );
}`,
      },
    },
  },
};
