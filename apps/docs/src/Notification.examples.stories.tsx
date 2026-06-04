import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Notification,
  NotificationStack,
  type NotificationPlacement,
} from '@pitchfork-ui/react';

const notificationStackConstrainedStyle: React.CSSProperties = {
  position: 'absolute',
  width: 'min(420px, calc(100% - 32px))',
};

function NotificationPreview({
  children,
  minHeight = 160,
  placement = 'top-right',
}: {
  children: React.ReactNode;
  minHeight?: number;
  placement?: NotificationPlacement;
}) {
  return (
    <div style={{ minHeight, position: 'relative', width: '100%' }}>
      <NotificationStack placement={placement} style={notificationStackConstrainedStyle}>
        {children}
      </NotificationStack>
    </div>
  );
}

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
    <NotificationPreview minHeight={360}>
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
    </NotificationPreview>
  ),
  parameters: {
    docs: {
      source: {
        code: `<NotificationStack placement="top-right">
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
</NotificationStack>`,
      },
    },
  },
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
    />
  ),
  parameters: {
    docs: {
      source: {
        code: `<Notification
  variant="danger"
  heading="Project archived"
  description="The project was archived and can be restored from settings within 30 days."
  action={
    <Button size="sm" variant="secondary">
      View details
    </Button>
  }
  dismissible
/>`,
      },
    },
  },
};

export const BottomLeftPlacement: Story = {
  args: {
    heading: 'Placement',
  },
  render: () => (
    <NotificationPreview placement="bottom-left" minHeight={160}>
      <Notification
        heading="Invite sent"
        description="Jordan will receive an invitation email shortly."
      />
    </NotificationPreview>
  ),
  parameters: {
    docs: {
      source: {
        code: `<NotificationStack placement="bottom-left">
  <Notification
    heading="Invite sent"
    description="Jordan will receive an invitation email shortly."
  />
</NotificationStack>`,
      },
    },
  },
};
