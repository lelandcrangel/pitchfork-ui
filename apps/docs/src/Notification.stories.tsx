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
    icon: { control: false },
    action: { control: false },
    onDismiss: { control: false },
  },
} satisfies Meta<NotificationStoryArgs>;

export default meta;
type Story = StoryObj<NotificationStoryArgs>;

export const Interactive: Story = {
  args: {
    placement: 'top-right',
  },

  render: ({ placement, ...args }) => (
    <NotificationStack placement={placement} style={{ maxWidth: 420 }}>
      <Notification {...args} />
    </NotificationStack>
  ),
};
