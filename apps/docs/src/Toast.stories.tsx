import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ToastProvider, useToast } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Toast',
  component: ToastProvider,
  tags: ['ai-generated', 'test'],
  args: {
    placement: 'top-right',
    defaultDuration: 4000,
  },
  argTypes: {
    placement: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
    },
    defaultDuration: { control: 'number' },
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToastButtons() {
  const { toast: fire } = useToast();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button
        variant="secondary"
        onClick={() =>
          fire({ heading: 'Info', description: 'Something happened.', variant: 'info' })
        }
      >
        Info
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          fire({ heading: 'Success', description: 'Operation completed.', variant: 'success' })
        }
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          fire({ heading: 'Warning', description: 'Proceed with care.', variant: 'warning' })
        }
      >
        Warning
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          fire({ heading: 'Danger', description: 'Something went wrong.', variant: 'danger' })
        }
      >
        Danger
      </Button>
    </div>
  );
}

export const Interactive: Story = {
  render: (args) => (
    <ToastProvider {...args}>
      <ToastButtons />
    </ToastProvider>
  ),
};
