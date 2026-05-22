import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, InlineCTA, UtilityButton, Icon } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/InlineCTA',
  component: InlineCTA,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof InlineCTA>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    heading: 'Complete your profile',
    description: 'Add your details to personalize your workspace.',
    action: <Button size="sm">Complete</Button>,
  },
};

export const Info: Story = {
  args: {
    tone: 'info',
    heading: 'New release notes',
    description: 'Version 2.4 is live with improved editing tools.',
    action: <Button size="sm" variant="secondary">Read notes</Button>,
  },
};

export const Success: Story = {
  args: {
    tone: 'success',
    iconName: 'circle-check',
    heading: 'Payment method verified',
    description: 'You are all set for the next billing cycle.',
  },
};

export const WarningWithActionGroup: Story = {
  args: {
    tone: 'warning',
    iconName: 'triangle-exclamation',
    heading: 'Storage is almost full',
    description: 'You have less than 10% storage remaining.',
    action: (
      <>
        <Button size="sm">Upgrade storage</Button>
        <UtilityButton aria-label="Dismiss notice">
          <Icon name="circle-xmark" aria-hidden />
        </UtilityButton>
      </>
    ),
  },
};
