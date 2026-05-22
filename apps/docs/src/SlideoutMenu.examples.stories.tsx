import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, SlideoutMenu } from '@pitchfork-ui/react';

const meta = {
  title: 'Examples/Slideout Menu',
  component: SlideoutMenu,
  tags: ['ai-generated', 'test', 'examplesHidden'],
  args: {
    open: false,
  },
} satisfies Meta<typeof SlideoutMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RightPlacement: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open right slideout</Button>
        <SlideoutMenu
          open={open}
          onOpenChange={setOpen}
          title="Right placement"
          description="Default placement for supporting side tasks."
          footer={<Button onClick={() => setOpen(false)}>Done</Button>}
        >
          <p style={{ margin: 0 }}>This drawer slides in from the right.</p>
        </SlideoutMenu>
      </>
    );
  },
};

export const LeftPlacement: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open left slideout</Button>
        <SlideoutMenu
          open={open}
          onOpenChange={setOpen}
          placement="left"
          title="Left placement"
          description="Useful for navigation or secondary controls."
          footer={<Button onClick={() => setOpen(false)}>Close</Button>}
        >
          <p style={{ margin: 0 }}>This drawer slides in from the left.</p>
        </SlideoutMenu>
      </>
    );
  },
};

export const LargePanel: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Open large slideout</Button>
        <SlideoutMenu
          open={open}
          onOpenChange={setOpen}
          size="lg"
          title="Large panel"
          description="Use large size for longer forms or richer detail layouts."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </>
          }
        >
          <p style={{ marginTop: 0 }}>
            This example uses the large size variant to provide more room.
          </p>
          <p style={{ marginBottom: 0 }}>
            Keep critical tasks concise and consider progressive disclosure for
            complex workflows.
          </p>
        </SlideoutMenu>
      </>
    );
  },
};
