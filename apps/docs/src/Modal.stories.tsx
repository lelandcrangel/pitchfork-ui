import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Modal } from '@pitchfork-ui/react';

const meta = {
  title: 'Components/Modals',
  component: Modal,
  tags: ['ai-generated', 'test'],
  args: {
    title: 'Edit workspace',
    description: 'Update workspace details and access settings.',
    size: 'md',
    closeOnOverlayClick: true,
    showCloseButton: true,
  },
  argTypes: {
    footer: { control: false },
    children: { control: false },
    onOpenChange: { control: false },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    open: false,
  },
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open modal</Button>
        <Modal
          {...args}
          open={open}
          onOpenChange={setOpen}
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save changes</Button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            This modal demonstrates overlay dismissal, escape handling, and a
            footer action row.
          </p>
        </Modal>
      </>
    );
  },
};
