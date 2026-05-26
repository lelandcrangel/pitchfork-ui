import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Notification,
  NotificationStack,
  type NotificationPlacement,
} from '@pitchfork-ui/react';

type NotificationStoryArgs = React.ComponentProps<typeof Notification> & {
  placement: NotificationPlacement;
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
      <NotificationStack
        placement={placement}
        style={{
          position: 'absolute',
          width: 'min(420px, calc(100% - 32px))',
        }}
      >
        {children}
      </NotificationStack>
    </div>
  );
}

const meta = {
  title: 'Components/Notifications',
  component: Notification,
  tags: ['ai-generated', 'test'],
  args: {
    heading: 'New export is ready',
    description:
      'Your analytics export finished processing and is ready to download.',
    variant: 'info',
    placement: 'top-right',
    dismissible: true,
    action: (
      <Button size="sm" variant="secondary">
        Download
      </Button>
    ),
  },
  argTypes: {
    placement: {
      control: 'inline-radio',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    icon: { control: 'text' },
    action: { control: 'text' },
    onDismiss: { action: 'dismissed' },
  },
} satisfies Meta<NotificationStoryArgs>;

export default meta;
type Story = StoryObj<NotificationStoryArgs>;

export const Interactive: Story = {
  args: {
    placement: 'top-right',
  },

  render: ({ placement, ...args }) => (
    <NotificationPreview placement={placement}>
      <Notification {...args} />
    </NotificationPreview>
  ),
};
