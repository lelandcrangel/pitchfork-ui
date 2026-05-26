import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
} from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Modals',
  component: Modal,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    open: false,
  },
  argTypes: {
    onOpenChange: { action: 'open changed' },
    footer: { control: 'text' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function ConfirmationStory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete project</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size="sm"
        title="Delete project"
        description="This action cannot be undone. All analytics and exports will be removed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Delete</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>Review the impact before confirming.</p>
      </Modal>
    </>
  );
}

function FormModalStory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite teammate</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Invite teammate"
        description="Add a collaborator and assign their starting role."
        footer={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Send invite</Button>
          </ModalFooter>
        }
      >
        <ModalBody style={{ display: 'grid', gap: 12, padding: 0 }}>
          <Input label="Email address" placeholder="teammate@company.com" />
          <Input label="Role" placeholder="Designer" />
        </ModalBody>
      </Modal>
    </>
  );
}

function LargeContentStory() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open release notes</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        size="lg"
        title="Release notes"
        description="A larger modal for longer-form content."
        footer={
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        }
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <p style={{ margin: 0 }}>
            This release improves search relevance, upload reliability, and
            dashboard performance.
          </p>
          <p style={{ margin: 0 }}>
            Teams can now manage permissions more granularly and review audit
            activity from one place.
          </p>
          <p style={{ margin: 0 }}>
            Use a larger modal when the content requires more reading space but
            should stay in context.
          </p>
        </div>
      </Modal>
    </>
  );
}

export const Confirmation: Story = {
  render: () => <ConfirmationStory />,
};

export const FormModal: Story = {
  render: () => <FormModalStory />,
};

export const LargeContent: Story = {
  render: () => <LargeContentStory />,
};
