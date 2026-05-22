import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Notification, NotificationStack } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Notifications',
  component: Notification,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof Notification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StackedToasts: Story = {
  args: {
    heading: 'Example',
  },
  render: () => (
    <NotificationStack style={{ maxWidth: 420 }}>
      <Notification
        variant="success"
        heading="Changes published"
        description="Your homepage updates are now live."
        dismissible
      />
      <Notification
        variant="info"
        heading="Background sync in progress"
        description="We are refreshing the latest analytics for your dashboard."
      />
      <Notification
        variant="warning"
        heading="Storage nearing limit"
        description="You have 12% of your storage remaining."
        action={<Button size="sm">Upgrade plan</Button>}
      />
    </NotificationStack>
  ),
};

export const DestructiveNotice: Story = {
  args: {
    heading: 'Delete warning',
  },
  render: () => (
    <Notification
      variant="danger"
      heading="Project archived"
      description="The project was archived and can be restored from settings within 30 days."
      action={
        <Button size="sm" variant="secondary">
          View details
        </Button>
      }
      dismissible
      style={{ maxWidth: 420 }}
    />
  ),
};

export const BottomLeftPlacement: Story = {
  args: {
    heading: 'Placement',
  },
  render: () => (
    <NotificationStack placement="bottom-left" style={{ maxWidth: 420 }}>
      <Notification
        heading="Invite sent"
        description="Jordan will receive an invitation email shortly."
      />
    </NotificationStack>
  ),
};
