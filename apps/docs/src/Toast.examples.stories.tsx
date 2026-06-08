import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, toast, ToastProvider, useToast } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Toast',
  component: ToastProvider,
  tags: ['ai-generated', 'test', 'examplesHidden'],
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => {
    function Inner() {
      const { toast: fire } = useToast();
      return (
        <Button
          variant="secondary"
          onClick={() =>
            fire({ heading: 'Saved', description: 'Your changes were saved.', variant: 'success' })
          }
        >
          Show toast
        </Button>
      );
    }
    return (
      <ToastProvider>
        <Inner />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `function App() {
  const { toast } = useToast();
  return (
    <Button onClick={() => toast({ heading: 'Saved', description: 'Your changes were saved.', variant: 'success' })}>
      Show toast
    </Button>
  );
}

// Wrap your app root once:
<ToastProvider>
  <App />
</ToastProvider>`,
      },
    },
  },
};

export const Variants: Story = {
  render: () => {
    function Inner() {
      const { toast: fire } = useToast();
      return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => fire({ heading: 'Info', variant: 'info' })}>
            Info
          </Button>
          <Button
            variant="secondary"
            onClick={() => fire({ heading: 'Success', variant: 'success' })}
          >
            Success
          </Button>
          <Button
            variant="secondary"
            onClick={() => fire({ heading: 'Warning', variant: 'warning' })}
          >
            Warning
          </Button>
          <Button
            variant="secondary"
            onClick={() => fire({ heading: 'Danger', variant: 'danger' })}
          >
            Danger
          </Button>
        </div>
      );
    }
    return (
      <ToastProvider>
        <Inner />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `const { toast } = useToast();

toast({ heading: 'Info',    variant: 'info' });
toast({ heading: 'Success', variant: 'success' });
toast({ heading: 'Warning', variant: 'warning' });
toast({ heading: 'Danger',  variant: 'danger' });

// Or via convenience helpers:
toast.info({ heading: 'Info' });
toast.success({ heading: 'Saved' });`,
      },
    },
  },
};

export const Persistent: Story = {
  name: 'Persistent (no auto-dismiss)',
  render: () => {
    function Inner() {
      const { toast: fire } = useToast();
      return (
        <Button
          variant="secondary"
          onClick={() =>
            fire({
              heading: 'Action required',
              description: 'Review the item before continuing.',
              variant: 'warning',
              duration: false,
              dismissible: true,
            })
          }
        >
          Show persistent
        </Button>
      );
    }
    return (
      <ToastProvider>
        <Inner />
      </ToastProvider>
    );
  },
  parameters: {
    docs: {
      source: {
        code: `toast({
  heading: 'Action required',
  description: 'Review the item before continuing.',
  variant: 'warning',
  duration: false,   // no auto-dismiss
  dismissible: true,
});`,
      },
    },
  },
};

export const ModuleLevel: Story = {
  name: 'Module-level helper',
  render: () => (
    <ToastProvider>
      <Button
        variant="secondary"
        onClick={() =>
          toast.success({ heading: 'Done', description: 'Called outside a component.' })
        }
      >
        toast.success()
      </Button>
    </ToastProvider>
  ),
  parameters: {
    docs: {
      source: {
        code: `// Import toast directly — no hook needed
import { toast } from '@pitchfork-ui/react';

// Call from anywhere (event handlers, async callbacks, etc.)
toast.success({ heading: 'Done', description: 'Called outside a component.' });`,
      },
    },
  },
};

export const Placement: Story = {
  render: () => (
    <ToastProvider placement="bottom-right">
      <Button
        variant="secondary"
        onClick={() =>
          toast.info({
            heading: 'Bottom right',
            description: 'Placement is configurable per provider.',
          })
        }
      >
        Show bottom-right
      </Button>
    </ToastProvider>
  ),
  parameters: {
    docs: {
      source: {
        code: `<ToastProvider placement="bottom-right">
  <App />
</ToastProvider>`,
      },
    },
  },
};
